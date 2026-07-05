"""MemGateQA — production Cognee bridge with case persistence."""

from __future__ import annotations

import asyncio
import io
import json
import os
import re
import zipfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent_loop import agent_chat, chat_history, gap_fill_plan, loop_state, run_loop_tick
from agent_publish import (
    VISIBILITY_PUBLIC,
    VISIBILITY_UNLISTED,
    find_by_slug,
    list_user_agents,
    publish_agent,
    sanitize_public_case,
    unpublish_agent,
)
from model_tiers import list_tiers
from cognee_client import CogneeHttpClient, get_call_log
from grading import compute_health_breakdown, grade_test, health_score
from audit_pipeline import auto_audit_case
from auto_agent import run_auto_agent, run_fleet_auto_agent
from autonomous_gate import (
    GATE_PHASES,
    autonomous_enabled,
    gate_status,
    run_autonomous_gate,
    schedule_gate_run,
    start_gate_watch,
    stop_gate_watch,
)
from llm_providers import list_gemini_models, list_openai_models, provider_status, provider_status_full, test_llm
from workspace_settings import apply_to_env, cognee_config, load_workspace, public_settings, resolve_llm, save_workspace
from loop_runner import (
    auto_status,
    pipeline_after_interrogate,
    pipeline_after_remember,
    run_full_loop,
    start_auto_loop,
    stop_auto_loop,
)
from loop_store import LOOP_STEPS, get_ledger, to_loop_md, to_state_md
from memgate_memory import (
    add_fact,
    build_context,
    container_tag_for_case,
    forget as memory_forget,
    get_profile,
    index_case_evidence,
    search_hybrid,
    status as memory_status,
)
from developer_manifest import developer_manifest
from mock_cognee import WOLFPACK_ID, mock_recall, mock_remember, mock_surgery
from agent_builder import build_case_from_scaffold, builder_chat_turn
from evidence_ingest import ingest_payload
from agent_templates import build_agent_case, list_templates
from seed import ensure_seed
from storage import delete_case, get_case, list_cases, new_id, upsert_case

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_seed()
    yield


BRIDGE_VERSION = "3.4.0"
BRIDGE_CAPABILITIES = [
    "gate",
    "audit",
    "agent",
    "agents",
    "settings",
    "report",
    "graph",
    "proof_bundle",
    "schema",
    "reply_gate",
]

app = FastAPI(title="MemGateQA API", version=BRIDGE_VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EvidenceDocument(BaseModel):
    id: str = ""
    title: str
    body: str
    kind: str = "manual"
    shouldRemember: bool = True
    shouldForget: bool = False
    sensitivity: str = "internal"
    source: str = "manual"
    date: str = ""
    risk: str = ""


class MemoryTest(BaseModel):
    id: str = ""
    title: str
    category: str = "unsupported"
    question: str
    expected: str
    trap: str = ""
    severity: str = "medium"
    evidenceIds: List[str] = Field(default_factory=list)
    repairAction: str = "improve"
    weight: float = 0.1


class AgentCreatePayload(BaseModel):
    agentName: str
    templateId: str = "incident_commander"
    dataset: Optional[str] = None
    llmProvider: Optional[str] = None
    llmModel: Optional[str] = None
    modelTier: Optional[str] = None
    ownerId: Optional[str] = None
    launch: bool = False
    indexMemory: bool = True


class AgentConfigPayload(BaseModel):
    llmProvider: Optional[str] = None
    llmModel: Optional[str] = None
    modelTier: Optional[str] = None


class AgentPublishPayload(BaseModel):
    ownerId: Optional[str] = None
    visibility: str = "public"


class BuilderChatTurn(BaseModel):
    role: str
    content: str


class BuilderChatPayload(BaseModel):
    messages: List[BuilderChatTurn] = Field(default_factory=list)
    llmProvider: Optional[str] = None
    llmModel: Optional[str] = None
    modelTier: Optional[str] = None


class CreateFromScaffoldPayload(BaseModel):
    scaffold: Dict[str, Any]
    ownerId: Optional[str] = None
    llmProvider: Optional[str] = None
    llmModel: Optional[str] = None
    modelTier: Optional[str] = None
    indexMemory: bool = True


class WorkspaceSettingsPayload(BaseModel):
    llm: Optional[Dict[str, Any]] = None
    cognee: Optional[Dict[str, Any]] = None
    mcp: Optional[Dict[str, Any]] = None
    gate: Optional[Dict[str, Any]] = None
    webhooks: Optional[Dict[str, Any]] = None


class WebhookTestPayload(BaseModel):
    event: str = "agent.publish"
    payload: Optional[Dict[str, Any]] = None


class LlmTestPayload(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None


class CogneeTestPayload(BaseModel):
    baseUrl: Optional[str] = None
    apiKey: Optional[str] = None
    sessionId: Optional[str] = None


class AgentLaunchPayload(BaseModel):
    forceReindex: bool = True
    maxRepairCycles: int = Field(default=1, ge=1, le=5)
    autoCertify: bool = True
    startWatch: bool = False
    watchIntervalSec: int = Field(default=180, ge=60, le=3600)


class MemoryCasePayload(BaseModel):
    name: str
    agent: str
    dataset: str
    description: str = ""


class RememberPayload(BaseModel):
    dataset: str = ""
    evidence: List[EvidenceDocument] = Field(default_factory=list)


class ImprovePayload(BaseModel):
    dataset: str
    instruction: str
    approvedByHuman: bool = Field(default=False)


class ForgetPayload(BaseModel):
    dataset: str
    evidenceIds: List[str] = Field(default_factory=list)


class SurgeryPayload(BaseModel):
    dataset: str
    instruction: str
    evidenceIds: List[str] = Field(default_factory=list)
    approvedByHuman: bool = False
    actorRole: Literal["owner", "reviewer"] = "owner"


class ChatTurn(BaseModel):
    role: str
    content: str


class AgentChatPayload(BaseModel):
    message: str
    history: List[ChatTurn] = Field(default_factory=list)


class AgentLoopPayload(BaseModel):
    stepId: str = "observe"


class MemoryAddPayload(BaseModel):
    content: str
    kind: str = "manual"


class MemorySearchPayload(BaseModel):
    query: str
    mode: str = "hybrid"


class MemoryForgetPayload(BaseModel):
    factId: Optional[str] = None
    documentId: Optional[str] = None


class AutoLoopStartPayload(BaseModel):
    intervalSec: int = Field(default=120, ge=30, le=3600)


class AutoAgentPayload(BaseModel):
    applyRepair: bool = True
    startAutoLoop: bool = True
    intervalSec: int = Field(default=120, ge=30, le=3600)
    forceReindex: bool = False


class FleetAutoAgentPayload(BaseModel):
    applyRepair: bool = True
    startAutoLoop: bool = True
    intervalSec: int = Field(default=120, ge=30, le=3600)
    forceReindex: bool = False


def mock_enabled() -> bool:
    return os.getenv("MEMGATEQA_MOCK", "false").lower() == "true"


def auto_audit_enabled() -> bool:
    return os.getenv("MEMGATEQA_AUTO_AUDIT", "true").lower() != "false"


async def _remember_internal(case_id: str, _case: Dict[str, Any]) -> Dict[str, Any]:
    resp = await api_remember(case_id)
    return resp.get("data", {})


async def _interrogate_internal(case_id: str, _case: Dict[str, Any]) -> Dict[str, Any]:
    resp = await api_interrogate(case_id, rerun=False)
    return resp.get("data", {})


async def _surgery_internal(case_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    resp = await api_surgery(case_id, SurgeryPayload(**payload))
    return resp.get("data", {})


async def _rerun_internal(case_id: str, _case: Dict[str, Any]) -> Dict[str, Any]:
    resp = await api_rerun(case_id)
    return resp.get("data", {})


async def _report_internal(case_id: str) -> Dict[str, Any]:
    resp = await api_report(case_id)
    return resp.get("data", {})


def _gate_fns() -> Dict[str, Any]:
    return {
        "recall_fn": _recall_answer,
        "remember_fn": _remember_internal,
        "interrogate_fn": _interrogate_internal,
        "surgery_fn": _surgery_internal,
        "rerun_fn": _rerun_internal,
        "report_fn": _report_internal,
    }


_COGNEE_CLIENT: Optional[CogneeHttpClient] = None


def cognee_client() -> Optional[CogneeHttpClient]:
    global _COGNEE_CLIENT
    if mock_enabled():
        return None
    cfg = cognee_config()
    base_url = cfg["baseUrl"]
    api_key = cfg["apiKey"]
    if not base_url or not api_key:
        raise HTTPException(
            status_code=500,
            detail="Configure Cognee in Settings — base URL and API key required.",
        )
    if _COGNEE_CLIENT is None:
        _COGNEE_CLIENT = CogneeHttpClient(
            base_url=base_url,
            api_key=api_key,
            session_id=cfg["sessionId"],
            default_dataset=cfg["defaultDataset"],
        )
    return _COGNEE_CLIENT


async def aclose_cognee_client() -> None:
    global _COGNEE_CLIENT
    if _COGNEE_CLIENT is not None:
        await _COGNEE_CLIENT.aclose()
        _COGNEE_CLIENT = None


def evidence_to_memory_text(doc: Dict[str, Any], dataset: str) -> str:
    return (
        f"[MemGateQA Evidence]\nDataset: {dataset}\nID: {doc.get('id')}\n"
        f"Title: {doc.get('title')}\nSource: {doc.get('source')}\n"
        f"Date: {doc.get('date')}\nSensitivity: {doc.get('sensitivity')}\n"
        f"Body: {doc.get('body')}"
    )


def _require_case(case_id: str) -> Dict[str, Any]:
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


def _mode() -> str:
    return "mock" if mock_enabled() else "proxy"


def _hit_text(hit: Dict[str, Any]) -> str:
    return hit.get("text") or hit.get("raw", {}).get("value", "") or str(hit)


def _search_type_for_test(test: Dict[str, Any]) -> str:
    category = test.get("category", "")
    if category in ("stale", "contradiction", "freshness"):
        return "TEMPORAL"
    return "GRAPH_COMPLETION"


async def _recall_answer(
    question: str,
    dataset: Optional[str] = None,
    *,
    search_type: str = "GRAPH_COMPLETION",
    exclude_node_sets: Optional[List[str]] = None,
) -> tuple[str, List[Dict[str, Any]]]:
    client = cognee_client()
    if client is None:
        return f"[Mock recall for: {question}]", []

    fallbacks: List[str] = []
    for candidate in (search_type, "GRAPH_COMPLETION", "CHUNKS", "RAG_COMPLETION"):
        if candidate not in fallbacks:
            fallbacks.append(candidate)

    last_detail = ""
    for attempt, st in enumerate(fallbacks):
        try:
            hits = await client.recall(
                question,
                dataset,
                search_type=st,
                include_references=True,
                exclude_node_sets=exclude_node_sets,
            )
            if hits:
                return _hit_text(hits[0]), hits
            if attempt == len(fallbacks) - 1:
                return "(no recall results)", []
        except HTTPException as exc:
            last_detail = str(exc.detail)[:200]
            if exc.status_code in (409, 422, 503) and attempt < len(fallbacks) - 1:
                await asyncio.sleep(1.5 * (attempt + 1))
                continue
            if exc.status_code in (409, 422, 503):
                return f"(recall unavailable: {last_detail})", []
            raise
    return f"(recall unavailable: {last_detail})", []


async def _recall_for_test(test: Dict[str, Any], dataset: str) -> tuple[str, List[Dict[str, Any]]]:
    search_type = _search_type_for_test(test)
    exclude: Optional[List[str]] = None
    if test.get("category") == "privacy":
        exclude = ["private"]
    return await _recall_answer(
        test["question"],
        dataset,
        search_type=search_type,
        exclude_node_sets=exclude,
    )


@app.get("/health")
async def health() -> Dict[str, Any]:
    mode = "mock" if mock_enabled() else "cloud"
    ping_status: Optional[int] = None
    cognee_ok = False
    if not mock_enabled():
        try:
            ping_status = await cognee_client().ping()  # type: ignore[union-attr]
            cognee_ok = ping_status == 200
        except Exception:
            pass
    llm = provider_status()
    return {
        "ok": True,
        "bridge_version": BRIDGE_VERSION,
        "capabilities": BRIDGE_CAPABILITIES,
        "mode": mode,
        "cognee_reachable": cognee_ok,
        "cognee_ping_status": ping_status,
        "session_id": os.getenv("COGNEE_SESSION_ID"),
        "dataset": os.getenv("COGNEE_DATASET", "default_dataset"),
        "case_count": len(list_cases()),
        "integrations": {
            "llm": llm["provider"],
            "openai": llm["openai"],
            "gemini": llm["gemini"],
            "memgateMemory": True,
            "mcp_memgateqa": True,
        },
    }


@app.get("/api/integrations")
async def api_integrations() -> Dict[str, Any]:
    cognee_ok = False
    if not mock_enabled():
        try:
            cognee_ok = await cognee_client().ping() == 200  # type: ignore[union-attr]
        except Exception:
            pass
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "cognee": {
                "reachable": cognee_ok,
                "baseUrl": os.getenv("COGNEE_BASE_URL", ""),
                "dataset": os.getenv("COGNEE_DATASET", "default_dataset"),
                "sessionId": os.getenv("COGNEE_SESSION_ID"),
            },
            "llm": await provider_status_full(),
            "memgateMemory": memory_status(),
            "agents": {
                "cursor": {"mcp": ".mcp.json", "command": "npm run mcp:config"},
                "claude": {"mcp": "stdio memgateqa", "command": "npm run mcp"},
                "codex": {"cli": "npm run cli", "autoAudit": "memgateqa_auto_audit"},
            },
            "autoAudit": auto_audit_enabled(),
            "mcp": {
                "memgateqa": {
                    "transport": "stdio",
                    "command": "python server/mcp_memgateqa.py",
                    "tools": [
                        "memory",
                        "recall",
                        "context",
                        "memgateqa_auto_audit",
                        "memgateqa_list_cases",
                        "memgateqa_agent_chat",
                        "memgateqa_interrogate",
                        "memgateqa_loop_tick",
                        "memgateqa_run_full_loop",
                        "memgateqa_auto_loop",
                        "memgateqa_run_auto_agent",
                        "memgateqa_remember",
                        "memgateqa_get_case",
                    ],
                    "cli": "python server/memgate_cli.py",
                },
            },
            "loopEngineering": {
                "pattern": "observe → recall → grade → plan → verify",
                "steps": LOOP_STEPS,
                "humanGate": ["plan", "verify"],
                "loopReady": True,
                "repo": "https://github.com/cobusgreyling/loop-engineering",
            },
        },
    }


@app.get("/api/integrations/developer")
async def api_integrations_developer() -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": developer_manifest()}


@app.get("/api/integrations/mcp-config")
async def api_integrations_mcp_config() -> Dict[str, Any]:
    manifest = developer_manifest()
    return {"ok": True, "mode": _mode(), "data": manifest["mcp"]["config"]}


@app.get("/api/cases")
async def api_list_cases() -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": list_cases()}


@app.get("/api/cases/{case_id}")
async def api_get_case(case_id: str) -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": _require_case(case_id)}


@app.post("/api/cases")
async def api_create_case(payload: MemoryCasePayload) -> Dict[str, Any]:
    case_id = new_id("case")
    case = {
        "id": case_id,
        **payload.model_dump(),
        "status": "open",
        "evidence": [],
        "tests": [],
        "resultsBefore": [],
        "resultsAfter": [],
        "reports": [],
    }
    return {"ok": True, "mode": _mode(), "data": upsert_case(case)}


@app.get("/api/settings")
async def api_get_settings() -> Dict[str, Any]:
    from workspace_settings import bootstrap_from_env

    ws = bootstrap_from_env()
    llm_cfg = resolve_llm()
    cog = cognee_config(ws)
    cognee_ok = False
    if not mock_enabled():
        try:
            cognee_ok = await cognee_client().ping() == 200  # type: ignore[union-attr]
        except Exception:
            pass
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "settings": public_settings(ws),
            "status": {
                "cogneeReachable": cognee_ok,
                "llmProvider": llm_cfg["provider"],
                "llmModel": llm_cfg["model"],

            },
        },
    }


@app.put("/api/settings")
async def api_put_settings(payload: WorkspaceSettingsPayload) -> Dict[str, Any]:
    patch = payload.model_dump(exclude_none=True)
    current = load_workspace()
    for section in ("llm", "cognee", "webhooks"):
        sec = patch.get(section)
        if not sec:
            continue
        for key in (f"{k}Set" for k in ("openaiApiKey", "geminiApiKey", "apiKey", "secret")):
            sec.pop(key, None)
        for secret_key in ("openaiApiKey", "geminiApiKey", "apiKey", "secret"):
            val = sec.get(secret_key)
            if val and "…" in str(val) and len(str(val)) < 20:
                sec.pop(secret_key, None)
            elif not val and current.get(section, {}).get(secret_key):
                sec.pop(secret_key, None)
    saved = save_workspace(patch)
    await aclose_cognee_client()
    apply_to_env(saved)
    return {"ok": True, "mode": _mode(), "data": public_settings(saved)}


@app.get("/api/llm/model-tiers")
async def api_model_tiers() -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": list_tiers()}


@app.get("/api/settings/llm/models")
async def api_llm_models(provider: str = "gemini") -> Dict[str, Any]:
    if provider == "openai":
        models = await list_openai_models()
    elif provider == "gemini":
        models = await list_gemini_models()
    else:
        models = []
    return {"ok": True, "mode": _mode(), "data": {"provider": provider, "models": models}}


@app.post("/api/settings/test/llm")
async def api_test_llm(payload: LlmTestPayload = LlmTestPayload()) -> Dict[str, Any]:
    result = await test_llm(payload.provider, payload.model)
    return {"ok": result.get("ok", False), "mode": _mode(), "data": result}


@app.post("/api/webhooks/test")
async def api_webhook_test(payload: WebhookTestPayload = WebhookTestPayload()) -> Dict[str, Any]:
    from webhooks import dispatch_webhook

    event = payload.event or "agent.publish"
    body = payload.payload or {"test": True, "message": "MemGateQA webhook test"}
    result = await dispatch_webhook(event, body)
    return {"ok": result.get("ok", False), "mode": _mode(), "data": result}


@app.post("/api/settings/test/cognee")
async def api_test_cognee(payload: CogneeTestPayload = CogneeTestPayload()) -> Dict[str, Any]:
    cfg = cognee_config()
    base_url = (payload.baseUrl or cfg["baseUrl"]).rstrip("/")
    api_key = payload.apiKey or cfg["apiKey"]
    session_id = payload.sessionId or cfg["sessionId"]
    if not base_url or not api_key:
        return {"ok": False, "mode": _mode(), "data": {"ok": False, "error": "Base URL and API key required"}}
    client = CogneeHttpClient(base_url, api_key, session_id, cfg["defaultDataset"])
    try:
        status = await client.ping()
        datasets = await client.list_datasets() if status == 200 else []
        return {
            "ok": status == 200,
            "mode": _mode(),
            "data": {
                "ok": status == 200,
                "status": status,
                "datasetCount": len(datasets),
                "baseUrl": base_url,
            },
        }
    except Exception as exc:
        return {"ok": False, "mode": _mode(), "data": {"ok": False, "error": str(exc)[:300]}}
    finally:
        await client.aclose()


@app.get("/api/agents/templates")
async def api_agent_templates() -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": list_templates()}


@app.post("/api/agents/builder/chat")
async def api_agent_builder_chat(payload: BuilderChatPayload) -> Dict[str, Any]:
    messages = [{"role": m.role, "content": m.content} for m in payload.messages if m.content.strip()]
    data = await builder_chat_turn(
        messages,
        provider=payload.llmProvider,
        model=payload.llmModel,
        model_tier=payload.modelTier,
    )
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/agents/create-from-chat")
async def api_agent_create_from_chat(payload: CreateFromScaffoldPayload) -> Dict[str, Any]:
    if not payload.scaffold:
        raise HTTPException(status_code=400, detail="scaffold is required")
    try:
        case = build_case_from_scaffold(
            payload.scaffold,
            owner_id=payload.ownerId,
            llm_provider=payload.llmProvider,
            llm_model=payload.llmModel,
            model_tier=payload.modelTier,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    saved = upsert_case(case)
    indexed = False
    if payload.indexMemory:
        try:
            await api_remember(saved["id"])
            indexed = True
            saved = get_case(saved["id"]) or saved
        except Exception:
            pass
    return {
        "ok": True,
        "mode": _mode(),
        "data": {"case": saved, "indexed": indexed, "evidenceCount": len(saved.get("evidence", []))},
    }


@app.post("/api/agents/create")
async def api_agent_create(payload: AgentCreatePayload) -> Dict[str, Any]:
    name = (payload.agentName or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="agentName is required")
    case_id = new_id("case")
    case = build_agent_case(
        case_id=case_id,
        agent_name=name,
        template_id=payload.templateId,
        dataset=payload.dataset,
        llm_provider=payload.llmProvider,
        llm_model=payload.llmModel,
        model_tier=payload.modelTier,
        owner_id=payload.ownerId,
    )
    saved = upsert_case(case)
    indexed = False
    if payload.indexMemory and not mock_enabled():
        try:
            await api_remember(case_id)
            indexed = True
            saved = get_case(case_id) or saved
        except Exception:
            pass
    elif payload.indexMemory and mock_enabled():
        await api_remember(case_id)
        indexed = True
        saved = get_case(case_id) or saved
    result: Dict[str, Any] = {
        "case": saved,
        "templateId": payload.templateId,
        "dataset": saved["dataset"],
        "evidenceCount": len(saved.get("evidence", [])),
        "trapCount": len(saved.get("tests", [])),
        "launched": False,
        "indexed": indexed,
    }
    if payload.launch:
        gate = await run_autonomous_gate(
            case_id,
            **_gate_fns(),
            force_reindex=True,
            max_cycles=1,
            auto_certify=True,
        )
        result["launched"] = True
        result["gate"] = {**gate, "phases": GATE_PHASES}
        result["case"] = get_case(case_id) or saved
    return {"ok": True, "mode": _mode(), "data": result}


@app.patch("/api/agents/{case_id}/config")
async def api_agent_config(case_id: str, payload: AgentConfigPayload) -> Dict[str, Any]:
    case = _require_case(case_id)
    if payload.llmProvider:
        case["llmProvider"] = payload.llmProvider
    if payload.llmModel:
        case["llmModel"] = payload.llmModel
    if payload.modelTier:
        case["modelTier"] = payload.modelTier
    saved = upsert_case(case)
    llm_cfg = resolve_llm(saved)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {"case": saved, "llm": llm_cfg},
    }


@app.post("/api/agents/{case_id}/publish")
async def api_agent_publish(case_id: str, payload: AgentPublishPayload = AgentPublishPayload()) -> Dict[str, Any]:
    _require_case(case_id)
    vis = payload.visibility if payload.visibility in (VISIBILITY_PUBLIC, VISIBILITY_UNLISTED, "private") else VISIBILITY_PUBLIC
    if vis == "private":
        data = unpublish_agent(case_id)
    else:
        data = publish_agent(case_id, owner_id=payload.ownerId, visibility=vis)
    return {"ok": True, "mode": _mode(), "data": data}


@app.get("/api/agents/mine")
async def api_agents_mine(ownerId: Optional[str] = None) -> Dict[str, Any]:
    return {"ok": True, "mode": _mode(), "data": list_user_agents(ownerId)}


@app.get("/api/public/agents/{slug}")
async def api_public_agent(slug: str) -> Dict[str, Any]:
    case = find_by_slug(slug)
    if not case:
        raise HTTPException(status_code=404, detail="Agent not published or link expired")
    return {"ok": True, "mode": _mode(), "data": sanitize_public_case(case)}


@app.post("/api/public/agents/{slug}/chat")
async def api_public_agent_chat(slug: str, payload: AgentChatPayload) -> Dict[str, Any]:
    case = find_by_slug(slug)
    if not case:
        raise HTTPException(status_code=404, detail="Agent not published")
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message required")
    hist = [{"role": t.role, "content": t.content} for t in payload.history] if payload.history else None
    data = await agent_chat(case, payload.message.strip(), _recall_answer, history=hist)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/agents/{case_id}/launch")
async def api_agent_launch(case_id: str, payload: AgentLaunchPayload = AgentLaunchPayload()) -> Dict[str, Any]:
    case = _require_case(case_id)
    gate = await run_autonomous_gate(
        case_id,
        **_gate_fns(),
        force_reindex=payload.forceReindex,
        max_cycles=payload.maxRepairCycles,
        auto_certify=payload.autoCertify,
    )
    if payload.startWatch and gate.get("ok") and not gate.get("shipReady"):
        watch = await start_gate_watch(
            case_id,
            **_gate_fns(),
            interval_sec=payload.watchIntervalSec,
        )
        gate["watch"] = watch
    fresh = get_case(case_id) or case
    return {
        "ok": gate.get("ok", False),
        "mode": _mode(),
        "data": {
            "case": fresh,
            "gate": {**gate, "phases": GATE_PHASES},
            "dataset": fresh.get("dataset"),
            "health": gate.get("health") or fresh.get("lastScore"),
            "shipReady": gate.get("shipReady", False),
        },
    }


@app.delete("/api/cases/{case_id}")
async def api_delete_case(case_id: str) -> Dict[str, Any]:
    if not delete_case(case_id):
        raise HTTPException(status_code=404, detail="Case not found")
    return {"ok": True, "data": {"deleted": case_id}}


class EvidenceParsePayload(BaseModel):
    text: str = ""
    url: Optional[str] = None
    filename: Optional[str] = None


@app.post("/api/evidence/parse")
async def api_parse_evidence(payload: EvidenceParsePayload) -> Dict[str, Any]:
    try:
        data = await ingest_payload(
            text=payload.text or "",
            url=payload.url or "",
            filename=payload.filename or "",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)[:300]) from exc
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/evidence")
async def api_add_evidence(case_id: str, doc: EvidenceDocument) -> Dict[str, Any]:
    case = _require_case(case_id)
    item = doc.model_dump()
    if not item["id"]:
        item["id"] = new_id("ev")
    case["evidence"].append(item)
    upsert_case(case)
    if item.get("shouldRemember", True):
        from memgate_memory import add_document, container_tag_for_case

        tag = container_tag_for_case(case_id)
        content = f"Title: {item.get('title')}\nBody: {item.get('body')}"
        add_document(tag, content, meta={"id": item["id"], "title": item.get("title"), "kind": "evidence"})
    if autonomous_enabled() and case.get("tests"):
        await schedule_gate_run(case_id, **_gate_fns(), force_reindex=True)
    return {"ok": True, "mode": _mode(), "data": item, "autonomousGate": autonomous_enabled()}


@app.delete("/api/cases/{case_id}/evidence/{evidence_id}")
async def api_delete_evidence(case_id: str, evidence_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    case["evidence"] = [e for e in case["evidence"] if e["id"] != evidence_id]
    upsert_case(case)
    return {"ok": True, "data": {"deleted": evidence_id}}


@app.post("/api/cases/{case_id}/tests")
async def api_add_test(case_id: str, test: MemoryTest) -> Dict[str, Any]:
    case = _require_case(case_id)
    item = test.model_dump()
    if not item["id"]:
        item["id"] = new_id("test")
    case["tests"].append(item)
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": item}


@app.delete("/api/cases/{case_id}/tests/{test_id}")
async def api_delete_test(case_id: str, test_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    case["tests"] = [t for t in case["tests"] if t["id"] != test_id]
    upsert_case(case)
    return {"ok": True, "data": {"deleted": test_id}}


@app.post("/api/cases/{case_id}/remember")
async def api_remember(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()
    stored: List[str] = []
    data_ids: Dict[str, str] = case.get("cogneeDataIds", {})
    if mock_enabled():
        stored = mock_remember(case)
        for doc_id in stored:
            data_ids[doc_id] = f"mock-{doc_id}"
    else:
        docs_to_store = [doc for doc in case.get("evidence", []) if doc.get("shouldRemember", True)]
        if client is not None and docs_to_store:

            async def _remember_one(doc: Dict[str, Any]) -> str:
                text = evidence_to_memory_text(doc, dataset)
                await client.remember_fact(
                    doc["id"],
                    text,
                    dataset,
                    sensitivity=doc.get("sensitivity"),
                    resolve_data_id=False,
                )
                return doc["id"]

            stored = await asyncio.gather(*[_remember_one(doc) for doc in docs_to_store])
            resolved = await client.resolve_data_ids(dataset, list(stored))
            data_ids.update(resolved)
        else:
            stored = [doc["id"] for doc in docs_to_store]
    if client is not None and stored:
        try:
            await client.memify(dataset, background=True)
        except HTTPException:
            pass
    mem_index = index_case_evidence(case)
    case["memgateContainer"] = mem_index.get("containerTag")
    case["cogneeDataIds"] = data_ids
    case["status"] = "intake"
    upsert_case(case)
    fresh = _require_case(case_id)
    pipeline = await pipeline_after_remember(case_id, fresh, _recall_answer)
    if autonomous_enabled() and case.get("tests"):
        await schedule_gate_run(case_id, **_gate_fns(), force_reindex=False)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "stored": stored,
            "dataset": dataset,
            "dataIds": data_ids,
            "memgateContainer": fresh.get("memgateContainer"),
            "autoPipeline": pipeline,
            "autonomousGate": autonomous_enabled(),
        },
    }


@app.post("/api/cases/{case_id}/interrogate")
async def api_interrogate(case_id: str, rerun: bool = False) -> Dict[str, Any]:
    case = _require_case(case_id)
    tests = case.get("tests", [])
    if not tests:
        raise HTTPException(status_code=400, detail="Add memory tests before interrogation")

    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    results: List[Dict[str, Any]] = []
    if mock_enabled() and case_id == WOLFPACK_ID:
        from mock_cognee import mock_log
        mock_log("recall", dataset, f"Trap interrogation · {'rerun' if rerun else 'baseline'}")
    sem = asyncio.Semaphore(3)

    async def _grade_one(test: Dict[str, Any]) -> Dict[str, Any]:
        if mock_enabled() and case_id == WOLFPACK_ID:
            actual, hits = mock_recall(test, after_repair=rerun)
        else:
            async with sem:
                actual, hits = await _recall_for_test(test, dataset)
        graded = grade_test(test, actual)
        refs = []
        for hit in hits[:3]:
            for ref in hit.get("references", []) or hit.get("citations", []) or []:
                if isinstance(ref, dict):
                    refs.append(ref)
                elif isinstance(ref, str):
                    refs.append({"id": ref, "source": "cognee"})
        if refs:
            graded["references"] = refs[:5]
            graded["citedIds"] = [
                str(r.get("id") or r.get("chunkId") or r.get("dataId") or r.get("sourceId") or r.get("source", ""))
                for r in refs[:5]
                if r.get("id") or r.get("chunkId") or r.get("dataId") or r.get("sourceId") or r.get("source")
            ]
        if test.get("category") == "privacy":
            graded["nodeSetScope"] = "private subgraph excluded via excludeNodeSets"
        search = _search_type_for_test(test)
        if search == "TEMPORAL":
            graded["searchType"] = "TEMPORAL"
        if mock_enabled() and case_id == WOLFPACK_ID and hits:
            mock_refs = hits[0].get("references", [])
            if mock_refs and "citedIds" not in graded:
                graded["citedIds"] = [
                    str(r.get("id") or r.get("source", "")) for r in mock_refs if isinstance(r, dict)
                ]
        return graded

    results = list(await asyncio.gather(*[_grade_one(test) for test in tests]))

    key = "resultsAfter" if rerun else "resultsBefore"
    case[key] = results
    case["status"] = "repaired" if rerun else "tested"
    breakdown = compute_health_breakdown(results, tests)
    score = health_score(breakdown)
    case["lastScore"] = score
    case["lastBreakdown"] = breakdown
    upsert_case(case)
    fresh = _require_case(case_id)
    skip_plan = autonomous_enabled() and not rerun
    pipeline = await pipeline_after_interrogate(
        case_id, fresh, _recall_answer, generate_plan=not skip_plan
    )

    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "results": results,
            "score": score,
            "breakdown": breakdown,
            "rerun": rerun,
            "autoPipeline": pipeline,
            "pendingRepairPlan": fresh.get("pendingRepairPlan"),
        },
    }


@app.post("/api/cases/{case_id}/surgery")
async def api_surgery(case_id: str, payload: SurgeryPayload) -> Dict[str, Any]:
    if not payload.approvedByHuman:
        raise HTTPException(status_code=403, detail="Memory surgery requires human approval")
    if payload.actorRole == "reviewer" and payload.evidenceIds:
        raise HTTPException(
            status_code=403,
            detail="RBAC gate: Reviewer role cannot execute forget() — only Case Owner may delete memory",
        )
    case = _require_case(case_id)
    dataset = payload.dataset or case.get("dataset", "default_dataset")
    client = cognee_client()
    forgotten: List[str] = []
    data_ids: Dict[str, str] = case.get("cogneeDataIds", {})
    if mock_enabled():
        for ev_id in payload.evidenceIds:
            forgotten.append(ev_id)
            data_ids.pop(ev_id, None)
        mock_surgery(case, payload.instruction, forgotten)
    elif client is not None:
        from wolfpack_repair import ensure_forget_targets_indexed, inject_repair_facts

        data_ids = await ensure_forget_targets_indexed(
            client, case, dataset, data_ids, payload.evidenceIds
        )
        for ev_id in payload.evidenceIds:
            data_id = data_ids.get(ev_id)
            try:
                await client.forget(dataset, data_id=data_id, fact_id=ev_id)
                forgotten.append(ev_id)
                data_ids.pop(ev_id, None)
            except HTTPException:
                pass
        failed = [r for r in case.get("resultsBefore", []) if r.get("status") == "fail"]
        feedback_query = None
        refs: List[Dict[str, Any]] = []
        if failed:
            fail_test = next(
                (t for t in case.get("tests", []) if t["id"] == failed[0].get("testId")),
                None,
            )
            if fail_test:
                feedback_query = fail_test.get("question")
            for result in failed[:3]:
                refs.extend(result.get("references", []))
        await client.improve(
            dataset,
            f"[MemGateQA correction] {payload.instruction}",
            feedback_query=feedback_query,
            references=refs or None,
        )
        data_ids = await inject_repair_facts(client, dataset, data_ids=data_ids)
    case["cogneeDataIds"] = data_ids
    case["status"] = "surgery"
    upsert_case(case)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "surgery": "complete",
            "caseId": case_id,
            "forgotten": forgotten,
            "actorRole": payload.actorRole,
            "rbacGate": payload.actorRole == "owner",
        },
    }


@app.post("/api/cases/{case_id}/rerun")
async def api_rerun(case_id: str) -> Dict[str, Any]:
    return await api_interrogate(case_id, rerun=True)


@app.get("/api/cases/{case_id}/schema/inventory")
async def api_schema_inventory(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()
    if client is None:
        nodes = len(case.get("cogneeDataIds", {}))
        return {
            "ok": True,
            "mode": _mode(),
            "data": {
                "total_entities": nodes,
                "types": [{"type": "Evidence", "count": nodes}],
                "mock": True,
            },
        }
    inventory = await client.schema_inventory(dataset)
    return {"ok": True, "mode": _mode(), "data": inventory}


@app.get("/api/cases/{case_id}/schema/provenance")
async def api_schema_provenance(case_id: str, include_memory: bool = False) -> Dict[str, Any]:
    case = _require_case(case_id)
    client = cognee_client()
    if client is None:
        return {
            "ok": True,
            "mode": _mode(),
            "data": {
                "chain": [
                    {"role": "tenant", "label": "MemGateQA mock tenant"},
                    {"role": "dataset", "label": case.get("dataset", case_id)},
                    {"role": "agent", "label": case.get("agent", "agent")},
                ],
                "mock": True,
            },
        }
    provenance = await client.schema_provenance(include_memory=include_memory)
    return {"ok": True, "mode": _mode(), "data": provenance}


@app.get("/api/cases/{case_id}/wiki/audit")
async def api_wiki_audit(case_id: str) -> Dict[str, Any]:
    """Plaid-style knowledge audit — graph size + trap health snapshot."""
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    nodes = 0
    edges = 0
    client = cognee_client()
    if client is not None:
        try:
            graph = await client.get_graph(dataset)
            nodes = len(graph.get("nodes") or [])
            edges = len(graph.get("edges") or [])
        except Exception:
            pass
    before = case.get("resultsBefore") or []
    failures = [r for r in before if r.get("status") == "fail"]
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "caseId": case_id,
            "nodeCount": nodes,
            "edgeCount": edges,
            "evidenceCount": len(case.get("evidence") or []),
            "trapCount": len(case.get("tests") or []),
            "openFailures": len(failures),
            "healthScore": case.get("lastScore"),
            "shipReady": (case.get("lastScore") or 0) >= 80,
        },
    }


def _slug_graph_id(prefix: str, text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:48]
    return f"{prefix}-{slug or 'node'}"


def _graph_link_key(source: str, target: str, label: str = "") -> str:
    return f"{source}|{target}|{label}"


def _merge_graph_dicts(
    primary: Dict[str, Any], enrich: Dict[str, Any]
) -> Dict[str, Any]:
    node_map: Dict[str, Dict[str, Any]] = {}
    for n in (primary.get("nodes") or []) + (enrich.get("nodes") or []):
        nid = n.get("id")
        if not nid:
            continue
        prev = node_map.get(nid)
        node_map[nid] = {**(prev or {}), **n, "label": n.get("label") or (prev or {}).get("label")}
    edge_map: Dict[str, Dict[str, Any]] = {}
    for e in (primary.get("edges") or []) + (enrich.get("edges") or []):
        src, tgt = e.get("source"), e.get("target")
        if not src or not tgt:
            continue
        key = _graph_link_key(src, tgt, e.get("label") or "")
        edge_map[key] = e
    return {"nodes": list(node_map.values()), "edges": list(edge_map.values())}


def _synthesize_case_graph(case: Dict[str, Any]) -> Dict[str, Any]:
    """Build Obsidian-style graph from case evidence — chunks, concepts, sources, tests."""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    seen_edges: set[str] = set()
    agent_id = "__agent__"
    agent_label = case.get("agent") or case.get("name") or "Agent memory"
    nodes.append({"id": agent_id, "label": agent_label, "type": "Agent"})

    def add_edge(source: str, target: str, label: str) -> None:
        if source == target:
            return
        key = _graph_link_key(source, target, label)
        if key in seen_edges:
            return
        seen_edges.add(key)
        edges.append({"source": source, "target": target, "label": label})

    kind_nodes: Dict[str, str] = {}
    source_nodes: Dict[str, str] = {}
    concept_nodes: Dict[str, str] = {}
    category_nodes: Dict[str, str] = {}

    evidence = case.get("evidence") or []
    for ev in evidence:
        eid = ev.get("id")
        if not eid:
            continue
        nodes.append(
            {
                "id": eid,
                "label": ev.get("title") or eid,
                "type": "Evidence",
                "properties": {
                    "sensitivity": ev.get("sensitivity", "internal"),
                    "kind": ev.get("kind"),
                    "source": ev.get("source"),
                },
            }
        )
        add_edge(agent_id, eid, "remembers")

        kind = ev.get("kind")
        if kind:
            kid = kind_nodes.get(kind) or _slug_graph_id("kind", kind)
            if kind not in kind_nodes:
                kind_nodes[kind] = kid
                nodes.append({"id": kid, "label": kind, "type": "Kind"})
                add_edge(agent_id, kid, "tracks")
            add_edge(eid, kid, "typed_as")

        src_file = ev.get("source")
        if src_file:
            sid = source_nodes.get(src_file) or _slug_graph_id("src", src_file)
            if src_file not in source_nodes:
                source_nodes[src_file] = sid
                nodes.append({"id": sid, "label": src_file, "type": "Source"})
            add_edge(eid, sid, "from")

        body = ev.get("body") or ""
        for i, sentence in enumerate(re.split(r"[.!?]+", body)):
            sentence = sentence.strip()
            if len(sentence) < 10 or i >= 8:
                continue
            cid = f"{eid}__chunk_{i}"
            nodes.append({"id": cid, "label": sentence[:72], "type": "DocumentChunk", "properties": {"parent": eid}})
            add_edge(eid, cid, "contains")
            for term in re.findall(
                r"\b(?:Next\.js|Postgres|pgvector|Cognee(?:\s+Cloud)?|Supabase|Twilio|Vercel|Redis)\b",
                sentence,
                re.I,
            ):
                key = term.lower()
                concept_id = concept_nodes.get(key) or _slug_graph_id("concept", term)
                if key not in concept_nodes:
                    concept_nodes[key] = concept_id
                    nodes.append({"id": concept_id, "label": term, "type": "Concept"})
                add_edge(cid, concept_id, "mentions")
                add_edge(eid, concept_id, "references")

    tests = case.get("tests") or []
    for test in tests:
        tid = f"test-{test.get('id', '')}"
        if not test.get("id"):
            continue
        nodes.append({"id": tid, "label": test.get("title") or test["id"], "type": "Test"})
        add_edge(agent_id, tid, "checks")
        cat = test.get("category")
        if cat:
            cat_id = category_nodes.get(cat) or _slug_graph_id("cat", cat)
            if cat not in category_nodes:
                category_nodes[cat] = cat_id
                nodes.append({"id": cat_id, "label": cat, "type": "Category"})
                add_edge(agent_id, cat_id, "audits")
            add_edge(tid, cat_id, "category")
        for eid in test.get("evidenceIds") or []:
            if any(e.get("id") == eid for e in evidence):
                add_edge(tid, eid, "covers")

    for i in range(len(evidence) - 1):
        a, b = evidence[i].get("id"), evidence[i + 1].get("id")
        if a and b:
            add_edge(a, b, "related")

    stale = [e for e in evidence if re.search(r"stale|old|superseded|draft|bad", f"{e.get('title','')} {e.get('risk','')}", re.I)]
    fresh = [e for e in evidence if re.search(r"final|authoritative|decision|policy", f"{e.get('title','')} {e.get('risk','')}", re.I)]
    for s in stale:
        for f in fresh:
            if s.get("id") and f.get("id") and s["id"] != f["id"]:
                add_edge(s["id"], f["id"], "contradicts")

    return {"nodes": nodes, "edges": edges, "synthesized": True}


@app.get("/api/cases/{case_id}/graph")
async def api_graph(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()
    if client is None:
        syn = _synthesize_case_graph(case)
        if syn["nodes"]:
            return {"ok": True, "mode": _mode(), "data": syn}
        return {"ok": True, "mode": _mode(), "data": {"nodes": [], "edges": [], "mock": True}}
    graph = await client.get_graph(dataset)
    syn = _synthesize_case_graph(case)
    if syn.get("nodes"):
        if not (graph.get("nodes") or []):
            return {"ok": True, "mode": _mode(), "data": syn}
        merged = _merge_graph_dicts(graph, syn)
        merged["enriched"] = True
        return {"ok": True, "mode": _mode(), "data": merged}
    return {"ok": True, "mode": _mode(), "data": graph}


@app.get("/api/cases/{case_id}/ops")
async def api_ops(case_id: str, limit: int = 40) -> Dict[str, Any]:
    _require_case(case_id)
    return {"ok": True, "mode": _mode(), "data": get_call_log(limit)}


@app.post("/api/cases/{case_id}/compare")
async def api_compare(case_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    case = _require_case(case_id)
    test_id = body.get("testId")
    test = next((t for t in case.get("tests", []) if t["id"] == test_id), None)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    rag_answer, _ = await _recall_answer(test["question"], dataset, search_type="RAG_COMPLETION")
    graph_answer, graph_hits = await _recall_answer(test["question"], dataset, search_type="GRAPH_COMPLETION")
    rag_grade = grade_test(test, rag_answer)
    graph_grade = grade_test(test, graph_answer)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "testId": test_id,
            "question": test["question"],
            "rag": {"answer": rag_answer, "grade": rag_grade},
            "graph": {"answer": graph_answer, "grade": graph_grade, "references": graph_hits[0].get("references", []) if graph_hits else []},
        },
    }


SHIP_TRAP_CATEGORIES = ("privacy", "forget", "stale", "contradiction", "premise")


@app.post("/api/cases/{case_id}/reply-gate")
async def api_reply_gate(case_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Extra step: before agent sends a reply, recall() + trap-check the answer."""
    case = _require_case(case_id)
    message = (body.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message required")
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    answer, _ = await _recall_answer(message, dataset, search_type="GRAPH_COMPLETION")

    traps = [t for t in case.get("tests", []) if t.get("category") in SHIP_TRAP_CATEGORIES]
    trap_results = []
    for test in traps[:6]:
        trap_answer, _ = await _recall_for_test(test, dataset)
        graded = grade_test(test, trap_answer)
        trap_results.append(
            {
                "testId": test["id"],
                "title": test.get("title"),
                "category": test.get("category"),
                "status": graded["status"],
                "reason": graded.get("reason", ""),
            }
        )

    message_grade = grade_test(
        {"category": "privacy", "expected": "must not expose secrets", "id": "reply-gate"},
        answer,
    )
    failures = [r for r in trap_results if r["status"] == "fail"]
    if message_grade["status"] == "fail":
        failures.append(
            {
                "testId": "reply-recall",
                "title": "User message recall",
                "category": "privacy",
                "status": "fail",
                "reason": message_grade.get("reason", "Recall leaked sensitive data"),
            }
        )

    ship = len(failures) == 0
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "verdict": "SHIP" if ship else "BLOCK",
            "shipReady": ship,
            "userMessage": message,
            "recallAnswer": answer[:1200],
            "trapResults": trap_results,
            "failures": failures,
            "checked": len(trap_results) + 1,
        },
    }


@app.get("/api/cases/{case_id}/agent/chat/history")
async def api_agent_chat_history(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    from agent_templates import chat_prompts_for_case, chat_welcome_for_case

    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "history": chat_history(case),
            "welcome": chat_welcome_for_case(case),
            "chatPrompts": chat_prompts_for_case(case),
            "modelTier": case.get("modelTier"),
            "llmProvider": case.get("llmProvider"),
            "llmModel": case.get("llmModel"),
        },
    }


@app.delete("/api/cases/{case_id}/agent/chat/history")
async def api_agent_chat_clear(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    case["chatHistory"] = []
    upsert_case(case)
    return {"ok": True, "data": {"cleared": True}}


@app.post("/api/cases/{case_id}/agent/chat")
async def api_agent_chat(case_id: str, payload: AgentChatPayload) -> Dict[str, Any]:
    case = _require_case(case_id)
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message required")
    hist = [{"role": t.role, "content": t.content} for t in payload.history] if payload.history else None
    data = await agent_chat(case, payload.message.strip(), _recall_answer, history=hist)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/agent/loop")
async def api_agent_loop(case_id: str, payload: AgentLoopPayload) -> Dict[str, Any]:
    case = _require_case(case_id)
    data = await run_loop_tick(case, payload.stepId, recall_fn=_recall_answer)
    if data.get("error"):
        raise HTTPException(status_code=400, detail=data["error"])
    return {"ok": True, "mode": _mode(), "data": data}


@app.get("/api/cases/{case_id}/agent/state")
async def api_agent_state(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    return {"ok": True, "mode": _mode(), "data": loop_state(case)}


@app.post("/api/cases/{case_id}/memory/add")
async def api_memory_add(case_id: str, payload: MemoryAddPayload) -> Dict[str, Any]:
    _require_case(case_id)
    tag = container_tag_for_case(case_id)
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content required")
    result = add_fact(tag, payload.content.strip(), kind=payload.kind)
    audit_result: Optional[Dict[str, Any]] = None
    if auto_audit_enabled() and payload.kind in ("mcp", "sdk", "manual", "agent"):
        audit_result = await auto_audit_case(
            case_id,
            recall_fn=_recall_answer,
            remember_fn=_remember_internal,
            interrogate_fn=_interrogate_internal,
        )
    return {"ok": True, "mode": _mode(), "data": {**result, "autoAudit": audit_result}}


@app.post("/api/cases/{case_id}/memory/search")
async def api_memory_search(case_id: str, payload: MemorySearchPayload) -> Dict[str, Any]:
    case = _require_case(case_id)
    tag = container_tag_for_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    data = await search_hybrid(
        tag,
        payload.query,
        dataset=dataset,
        recall_fn=_recall_answer,
        mode=payload.mode,
    )
    return {"ok": True, "mode": _mode(), "data": data}


@app.get("/api/cases/{case_id}/memory/profile")
async def api_memory_profile(case_id: str, q: str = "") -> Dict[str, Any]:
    _require_case(case_id)
    tag = container_tag_for_case(case_id)
    data = get_profile(tag, query=q or None)
    return {"ok": True, "mode": _mode(), "data": data}


@app.get("/api/cases/{case_id}/memory/context")
async def api_memory_context(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    tag = container_tag_for_case(case_id)
    text = build_context(tag, case_name=case.get("name", ""), health=case.get("lastScore"))
    return {"ok": True, "mode": _mode(), "data": {"context": text, "containerTag": tag}}


@app.post("/api/cases/{case_id}/memory/forget")
async def api_memory_forget(case_id: str, payload: MemoryForgetPayload) -> Dict[str, Any]:
    _require_case(case_id)
    tag = container_tag_for_case(case_id)
    data = memory_forget(tag, fact_id=payload.factId, document_id=payload.documentId)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/audit/auto")
async def api_auto_audit(case_id: str, force: bool = False) -> Dict[str, Any]:
    _require_case(case_id)
    data = await auto_audit_case(
        case_id,
        recall_fn=_recall_answer,
        remember_fn=_remember_internal,
        interrogate_fn=_interrogate_internal,
        force_reindex=force,
    )
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/loop/run-full")
async def api_loop_run_full(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    data = await run_full_loop(case, _recall_answer)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/loop/auto/start")
async def api_loop_auto_start(case_id: str, payload: AutoLoopStartPayload) -> Dict[str, Any]:
    _require_case(case_id)
    data = await start_auto_loop(case_id, _recall_answer, payload.intervalSec)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/loop/auto/stop")
async def api_loop_auto_stop(case_id: str) -> Dict[str, Any]:
    _require_case(case_id)
    data = await stop_auto_loop(case_id)
    return {"ok": True, "mode": _mode(), "data": data}


@app.get("/api/cases/{case_id}/loop/auto/status")
async def api_loop_auto_status(case_id: str) -> Dict[str, Any]:
    _require_case(case_id)
    return {"ok": True, "mode": _mode(), "data": auto_status(case_id)}


@app.get("/api/cases/{case_id}/loop/ledger")
async def api_loop_ledger(case_id: str, limit: int = 30) -> Dict[str, Any]:
    _require_case(case_id)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "ledger": get_ledger(case_id, limit),
            "stateMd": to_state_md(_require_case(case_id)),
            "loopMd": to_loop_md(case_id),
        },
    }


@app.post("/api/cases/{case_id}/agent/run-all")
async def api_agent_run_all(case_id: str, payload: AutoAgentPayload = AutoAgentPayload()) -> Dict[str, Any]:
    _require_case(case_id)
    data = await run_auto_agent(
        case_id,
        recall_fn=_recall_answer,
        remember_fn=_remember_internal,
        interrogate_fn=_interrogate_internal,
        surgery_fn=_surgery_internal,
        rerun_fn=_rerun_internal,
        force_reindex=payload.forceReindex,
        apply_repair=payload.applyRepair,
        start_auto_loop=payload.startAutoLoop,
        interval_sec=payload.intervalSec,
    )
    if not data.get("ok"):
        raise HTTPException(status_code=400, detail=data.get("error", "Auto agent failed"))
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/agent/run-fleet")
async def api_agent_run_fleet(payload: FleetAutoAgentPayload = FleetAutoAgentPayload()) -> Dict[str, Any]:
    data = await run_fleet_auto_agent(
        recall_fn=_recall_answer,
        remember_fn=_remember_internal,
        interrogate_fn=_interrogate_internal,
        surgery_fn=_surgery_internal,
        rerun_fn=_rerun_internal,
        list_cases_fn=list_cases,
        force_reindex=payload.forceReindex,
        apply_repair=payload.applyRepair,
        start_auto_loop=payload.startAutoLoop,
        interval_sec=payload.intervalSec,
    )
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/agent/gap-fill")
async def api_agent_gap_fill(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    failures = [r for r in (case.get("resultsBefore") or []) if r.get("status") == "fail"]
    if not failures:
        raise HTTPException(status_code=400, detail="No failed traps — run interrogation first")
    data = await gap_fill_plan(case, failures)
    return {"ok": True, "mode": _mode(), "data": data}


async def _build_report(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    before = case.get("resultsBefore", [])
    after = case.get("resultsAfter", [])
    tests = case.get("tests", [])
    breakdown_before = compute_health_breakdown(before, tests) if before else {}
    breakdown_after = compute_health_breakdown(after, tests) if after else {}
    data_ids = case.get("cogneeDataIds", {})
    forgotten_ids = [
        e["id"]
        for e in case.get("evidence", [])
        if e.get("shouldForget") and e["id"] not in data_ids
    ]
    forget_proof = {
        "dataItemsBefore": len(data_ids) + len(forgotten_ids),
        "dataItemsAfter": len(data_ids),
        "forgottenEvidence": forgotten_ids,
        "forgetVerified": all(
            r.get("status") == "pass"
            for r in after
            for t in tests
            if t.get("category") == "forget" and r.get("testId") == t["id"]
        )
        if after
        else None,
    }
    provenance: Dict[str, Any] = {}
    inventory: Dict[str, Any] = {}
    client = cognee_client()
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    if client is not None:
        try:
            provenance = await client.schema_provenance(include_memory=True)
        except HTTPException:
            provenance = {}
        try:
            inventory = await client.schema_inventory(dataset)
        except HTTPException:
            inventory = {}
    decoy_results = [
        {
            "testId": r.get("testId"),
            "status": r.get("status"),
            "reason": r.get("reason"),
        }
        for r in (after or before)
        for t in tests
        if t.get("category") == "decoy" and r.get("testId") == t["id"]
    ]
    spans: List[Dict[str, Any]] = []
    rbac_available = False
    if client is not None:
        try:
            span_data = await client.activity_spans(limit=40)
            spans = span_data.get("spans", span_data.get("data", [])) or []
            if isinstance(spans, dict):
                spans = [spans]
        except HTTPException:
            spans = [
                {
                    "op": entry.get("op"),
                    "ms": entry.get("ms"),
                    "ok": entry.get("ok"),
                    "dataset": entry.get("dataset"),
                    "t": entry.get("t"),
                    "source": "call_log",
                }
                for entry in get_call_log(40)
            ]
        rbac_available = await client.rbac_probe()
    else:
        spans = [
            {
                "op": entry.get("op"),
                "ms": entry.get("ms"),
                "ok": entry.get("ok"),
                "dataset": entry.get("dataset"),
                "t": entry.get("t"),
                "source": "mock_call_log",
            }
            for entry in get_call_log(40)
        ]
    trace_ids = [
        str(s.get("traceId") or s.get("spanId") or s.get("id") or f"{s.get('op')}-{int(s.get('t', 0))}")
        for s in spans[:12]
    ]
    report = {
        "caseId": case_id,
        "name": case.get("name"),
        "status": case.get("status"),
        "scoreBefore": health_score(breakdown_before) if before else None,
        "scoreAfter": health_score(breakdown_after) if after else None,
        "breakdownBefore": breakdown_before,
        "breakdownAfter": breakdown_after,
        "resultsBefore": before,
        "resultsAfter": after,
        "forgetProof": forget_proof,
        "provenance": provenance,
        "schemaInventory": inventory,
        "decoyResults": decoy_results,
        "activitySpans": spans[:20],
        "traceIds": trace_ids,
        "rbacAvailable": rbac_available,
        "evidenceMd": "docs/EVIDENCE.md",
        "scorecardJson": "results/scorecard.json",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": _mode(),
    }
    case["reports"] = case.get("reports", []) + [report]
    case["status"] = "closed"
    upsert_case(case)
    return report


@app.get("/api/cases/{case_id}/report")
async def api_report_get(case_id: str) -> Dict[str, Any]:
    data = await _build_report(case_id)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/report")
async def api_report_post(case_id: str) -> Dict[str, Any]:
    data = await _build_report(case_id)
    return {"ok": True, "mode": _mode(), "data": data}


class GateRunPayload(BaseModel):
    forceReindex: bool = False
    maxRepairCycles: int = Field(default=3, ge=1, le=5)
    autoCertify: bool = True
    startWatch: bool = False
    watchIntervalSec: int = Field(default=180, ge=60, le=3600)


@app.post("/api/cases/{case_id}/gate/run")
async def api_gate_run(case_id: str, payload: GateRunPayload = GateRunPayload()) -> Dict[str, Any]:
    _require_case(case_id)
    data = await run_autonomous_gate(
        case_id,
        **_gate_fns(),
        force_reindex=payload.forceReindex,
        max_cycles=payload.maxRepairCycles,
        auto_certify=payload.autoCertify,
    )
    if payload.startWatch and data.get("ok") and not data.get("shipReady"):
        watch = await start_gate_watch(
            case_id,
            **_gate_fns(),
            interval_sec=payload.watchIntervalSec,
        )
        data["watch"] = watch
    return {"ok": data.get("ok", False), "mode": _mode(), "data": {**data, "phases": GATE_PHASES}}


@app.get("/api/cases/{case_id}/gate/status")
async def api_gate_status(case_id: str) -> Dict[str, Any]:
    _require_case(case_id)
    return {"ok": True, "mode": _mode(), "data": {**gate_status(case_id), "phases": GATE_PHASES, "autonomousEnabled": autonomous_enabled()}}


@app.post("/api/cases/{case_id}/gate/watch/start")
async def api_gate_watch_start(case_id: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    _require_case(case_id)
    interval = int((body or {}).get("intervalSec", 180))
    data = await start_gate_watch(case_id, **_gate_fns(), interval_sec=interval)
    return {"ok": True, "mode": _mode(), "data": data}


@app.post("/api/cases/{case_id}/gate/watch/stop")
async def api_gate_watch_stop(case_id: str) -> Dict[str, Any]:
    _require_case(case_id)
    data = await stop_gate_watch(case_id)
    return {"ok": True, "mode": _mode(), "data": data}


@app.get("/api/cases/{case_id}/activity/spans")
async def api_activity_spans(case_id: str, limit: int = 40) -> Dict[str, Any]:
    _require_case(case_id)
    client = cognee_client()
    if client is None:
        return {"ok": True, "mode": _mode(), "data": {"spans": get_call_log(limit), "source": "mock_call_log"}}
    try:
        data = await client.activity_spans(limit=limit)
        return {"ok": True, "mode": _mode(), "data": data}
    except HTTPException:
        return {"ok": True, "mode": _mode(), "data": {"spans": get_call_log(limit), "source": "call_log_fallback"}}


@app.get("/api/integrations/rbac")
async def api_rbac_status() -> Dict[str, Any]:
    client = cognee_client()
    available = await client.rbac_probe() if client else False
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "available": available,
            "demoRoles": ["owner", "reviewer"],
            "gate": "Reviewer cannot execute forget() on Surgery page",
        },
    }


@app.get("/api/cases/{case_id}/proof-bundle")
async def api_proof_bundle(case_id: str):
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()

    scorecard_path = Path(__file__).resolve().parent.parent / "results" / "scorecard.json"
    scorecard = {}
    if scorecard_path.exists():
        scorecard = json.loads(scorecard_path.read_text(encoding="utf-8"))

    reports = case.get("reports", [])
    report = reports[-1] if reports else {
        "caseId": case_id,
        "name": case.get("name"),
        "scoreBefore": None,
        "scoreAfter": case.get("lastScore"),
        "resultsBefore": case.get("resultsBefore", []),
        "resultsAfter": case.get("resultsAfter", []),
    }

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("scorecard.json", json.dumps(scorecard or report, indent=2))
        zf.writestr("certificate.json", json.dumps(report, indent=2))
        zf.writestr("call_log.json", json.dumps(get_call_log(50), indent=2))
        if client is not None:
            try:
                export_bytes = await client.export_dataset(dataset)
                zf.writestr(f"dataset_export_{dataset}.json", export_bytes)
            except HTTPException:
                zf.writestr("dataset_export_README.txt", "Export unavailable on this tenant — certificate still valid.")
    buf.seek(0)
    filename = f"memgateqa-{case_id}-proof.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# Legacy endpoints for backward compatibility
@app.post("/remember")
async def legacy_remember(payload: RememberPayload) -> Dict[str, Any]:
    client = cognee_client()
    dataset = payload.dataset or os.getenv("COGNEE_DATASET", "default_dataset")
    stored = []
    for doc in payload.evidence:
        if not doc.shouldRemember:
            continue
        if client:
            await client.remember_entry(question=doc.title, answer=evidence_to_memory_text(doc.model_dump(), dataset), dataset_name=dataset)
        stored.append(doc.id)
    return {"ok": True, "mode": _mode(), "data": {"stored": stored}}


@app.post("/recall")
async def legacy_recall(payload: Dict[str, Any]) -> Dict[str, Any]:
    question = payload.get("test", {}).get("question", "")
    actual, _ = await _recall_answer(question)
    return {"ok": True, "mode": _mode(), "data": {"question": question, "results": [{"answer": actual, "source": _mode()}]}}


@app.post("/improve")
async def legacy_improve(payload: ImprovePayload) -> Dict[str, Any]:
    if not payload.approvedByHuman:
        raise HTTPException(status_code=403, detail="Approval required")
    client = cognee_client()
    if client:
        await client.improve(payload.dataset, payload.instruction)
    return {"ok": True, "mode": _mode(), "data": {"improved": True}}


@app.post("/forget")
async def legacy_forget(payload: ForgetPayload) -> Dict[str, Any]:
    client = cognee_client()
    forgotten: List[str] = []
    if client:
        for ev_id in payload.evidenceIds:
            try:
                await client.forget(payload.dataset, fact_id=ev_id)
                forgotten.append(ev_id)
            except HTTPException:
                pass
    return {"ok": True, "mode": _mode(), "data": {"forgotten": forgotten}}


if __name__ == "__main__":
    uvicorn.run("cognee_bridge:app", host="0.0.0.0", port=8788, reload=False)