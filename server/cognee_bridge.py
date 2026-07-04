"""MemGateQA — production Cognee bridge with case persistence."""

from __future__ import annotations

import os
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent_loop import agent_chat, gap_fill_plan, loop_state, run_loop_tick
from cognee_client import CogneeHttpClient, get_call_log
from grading import compute_health_breakdown, grade_test, health_score
from audit_pipeline import auto_audit_case
from auto_agent import run_auto_agent, run_fleet_auto_agent
from llm_providers import provider_status, provider_status_full
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
from mock_cognee import WOLFPACK_ID, mock_recall, mock_remember, mock_surgery
from seed import ensure_seed
from storage import delete_case, get_case, list_cases, new_id, upsert_case

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_seed()
    yield


app = FastAPI(title="MemGateQA API", version="3.1.0", lifespan=lifespan)
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


class AgentChatPayload(BaseModel):
    message: str


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
    return os.getenv("MEMGATEQA_MOCK", "true").lower() != "false"


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


def cognee_client() -> Optional[CogneeHttpClient]:
    if mock_enabled():
        return None
    base_url = os.getenv("COGNEE_BASE_URL", "").rstrip("/")
    api_key = os.getenv("COGNEE_API_KEY", "")
    if not base_url or not api_key:
        raise HTTPException(status_code=500, detail="Set COGNEE_BASE_URL and COGNEE_API_KEY in .env")
    return CogneeHttpClient(
        base_url=base_url,
        api_key=api_key,
        session_id=os.getenv("COGNEE_SESSION_ID", "memgateqa"),
        default_dataset=os.getenv("COGNEE_DATASET", "default_dataset"),
    )


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


async def _recall_answer(
    question: str,
    dataset: Optional[str] = None,
    *,
    search_type: str = "GRAPH_COMPLETION",
) -> tuple[str, List[Dict[str, Any]]]:
    client = cognee_client()
    if client is None:
        return f"[Mock recall for: {question}]", []
    hits = await client.recall(question, dataset, search_type=search_type, include_references=True)
    if not hits:
        return "(no recall results)", []
    return _hit_text(hits[0]), hits


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


@app.delete("/api/cases/{case_id}")
async def api_delete_case(case_id: str) -> Dict[str, Any]:
    if not delete_case(case_id):
        raise HTTPException(status_code=404, detail="Case not found")
    return {"ok": True, "data": {"deleted": case_id}}


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
    return {"ok": True, "mode": _mode(), "data": item}


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
        for doc in case.get("evidence", []):
            if not doc.get("shouldRemember", True):
                continue
            if client is not None:
                text = evidence_to_memory_text(doc, dataset)
                result = await client.remember_fact(doc["id"], text, dataset)
                if result.get("data_id"):
                    data_ids[doc["id"]] = result["data_id"]
            stored.append(doc["id"])
    if client is not None and stored:
        try:
            await client.memify(dataset)
        except HTTPException:
            pass
    mem_index = index_case_evidence(case)
    case["memgateContainer"] = mem_index.get("containerTag")
    case["cogneeDataIds"] = data_ids
    case["status"] = "intake"
    upsert_case(case)
    fresh = _require_case(case_id)
    pipeline = await pipeline_after_remember(case_id, fresh, _recall_answer)
    return {
        "ok": True,
        "mode": _mode(),
        "data": {
            "stored": stored,
            "dataset": dataset,
            "dataIds": data_ids,
            "memgateContainer": fresh.get("memgateContainer"),
            "autoPipeline": pipeline,
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
    for test in tests:
        if mock_enabled() and case_id == WOLFPACK_ID:
            actual, hits = mock_recall(test, after_repair=rerun)
        else:
            actual, hits = await _recall_answer(test["question"], dataset)
        graded = grade_test(test, actual)
        refs = []
        for hit in hits[:3]:
            for ref in hit.get("references", []) or hit.get("citations", []) or []:
                if isinstance(ref, dict):
                    refs.append(ref)
        if refs:
            graded["references"] = refs[:5]
        results.append(graded)

    key = "resultsAfter" if rerun else "resultsBefore"
    case[key] = results
    case["status"] = "repaired" if rerun else "tested"
    breakdown = compute_health_breakdown(results, tests)
    score = health_score(breakdown)
    case["lastScore"] = score
    case["lastBreakdown"] = breakdown
    upsert_case(case)
    fresh = _require_case(case_id)
    pipeline = await pipeline_after_interrogate(case_id, fresh, _recall_answer)

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
        for ev_id in payload.evidenceIds:
            data_id = data_ids.get(ev_id)
            try:
                await client.forget(dataset, data_id=data_id, fact_id=ev_id)
                forgotten.append(ev_id)
                data_ids.pop(ev_id, None)
            except HTTPException:
                pass
        await client.improve(dataset, f"[MemGateQA correction] {payload.instruction}")
        await client.memify(dataset)
    case["cogneeDataIds"] = data_ids
    case["status"] = "surgery"
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": {"surgery": "complete", "caseId": case_id, "forgotten": forgotten}}


@app.post("/api/cases/{case_id}/rerun")
async def api_rerun(case_id: str) -> Dict[str, Any]:
    return await api_interrogate(case_id, rerun=True)


@app.get("/api/cases/{case_id}/graph")
async def api_graph(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    dataset = case.get("dataset") or os.getenv("COGNEE_DATASET", "default_dataset")
    client = cognee_client()
    if client is None:
        return {"ok": True, "mode": _mode(), "data": {"nodes": [], "edges": [], "mock": True}}
    graph = await client.get_graph(dataset)
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


@app.post("/api/cases/{case_id}/agent/chat")
async def api_agent_chat(case_id: str, payload: AgentChatPayload) -> Dict[str, Any]:
    case = _require_case(case_id)
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message required")
    data = await agent_chat(case, payload.message.strip(), _recall_answer)
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


@app.get("/api/cases/{case_id}/report")
async def api_report(case_id: str) -> Dict[str, Any]:
    case = _require_case(case_id)
    before = case.get("resultsBefore", [])
    after = case.get("resultsAfter", [])
    tests = case.get("tests", [])
    breakdown_before = compute_health_breakdown(before, tests) if before else {}
    breakdown_after = compute_health_breakdown(after, tests) if after else {}
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
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": _mode(),
    }
    case["reports"] = case.get("reports", []) + [report]
    case["status"] = "closed"
    upsert_case(case)
    return {"ok": True, "mode": _mode(), "data": report}


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