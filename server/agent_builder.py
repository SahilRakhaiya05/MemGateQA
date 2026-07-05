"""Chat-first agent builder — real user facts only, no fictional demo data."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from agent_templates import slugify
from llm_providers import generate
from storage import new_id

BUILDER_SYSTEM = """You help users define a real Cognee memory agent for MemGateQA.

Rules:
- ONLY use facts the user explicitly provides. Never invent companies, incidents, or policies.
- Ask one short follow-up at a time if something is missing (purpose, key facts, private data).
- Keep language plain and professional — no roleplay, no fake incident IDs.

Persona design (when outputting scaffold):
- 2–3 sentences: role, tone, and hard boundaries.
- Must state: answer only from Cognee memory; cite evidence titles; abstain when unsure; never leak private data.

When you have: agent name (or clear label), purpose, and at least 2 concrete facts they want remembered,
append a JSON block on its own line:

SCAFFOLD_JSON
{"agentName":"...","purpose":"...","persona":"2-3 sentence system persona with boundaries","evidence":[{"title":"...","body":"...","sensitivity":"internal|private|public"}],"tests":[{"title":"...","question":"...","expected":"...","category":"stale|privacy|unsupported|contradiction"}]}

Tests must be answerable ONLY from their evidence. Questions must matter for their use case.
For unsupported tests, ask about something NOT in their evidence — expect abstain.
Do not output SCAFFOLD_JSON until the user has provided real content."""


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _parse_scaffold(text: str) -> Optional[Dict[str, Any]]:
    if "SCAFFOLD_JSON" not in text:
        return None
    chunk = text.split("SCAFFOLD_JSON", 1)[-1].strip()
    start = chunk.find("{")
    if start < 0:
        return None
    depth = 0
    for i in range(start, len(chunk)):
        if chunk[i] == "{":
            depth += 1
        elif chunk[i] == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(chunk[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None


def _reply_without_scaffold(text: str) -> str:
    if "SCAFFOLD_JSON" in text:
        return text.split("SCAFFOLD_JSON", 1)[0].strip()
    return text.strip()


def _normalize_scaffold(raw: Dict[str, Any]) -> Dict[str, Any]:
    name = (raw.get("agentName") or raw.get("name") or "My Agent").strip()[:60]
    purpose = (raw.get("purpose") or raw.get("description") or name).strip()[:500]
    persona = (raw.get("persona") or f"You are {name}. Use only Cognee memory from user-provided facts.").strip()[:800]
    evidence_in = raw.get("evidence") or []
    evidence: List[Dict[str, Any]] = []
    for i, ev in enumerate(evidence_in[:12]):
        if not isinstance(ev, dict):
            continue
        body = (ev.get("body") or ev.get("content") or "").strip()
        if len(body) < 8:
            continue
        sens = ev.get("sensitivity", "internal")
        if sens not in ("public", "internal", "private", "secret"):
            sens = "internal"
        evidence.append({
            "id": f"ev-{i + 1}",
            "title": (ev.get("title") or f"Fact {i + 1}")[:120],
            "kind": "user",
            "date": _today(),
            "source": "user-chat",
            "sensitivity": sens,
            "shouldRemember": sens not in ("secret",) or ev.get("shouldRemember", True),
            "shouldForget": bool(ev.get("shouldForget")),
            "risk": "User-provided",
            "body": body[:4000],
        })
    tests_in = raw.get("tests") or []
    tests: List[Dict[str, Any]] = []
    for i, test in enumerate(tests_in[:8]):
        if not isinstance(test, dict):
            continue
        q = (test.get("question") or "").strip()
        exp = (test.get("expected") or "").strip()
        if len(q) < 5 or len(exp) < 5:
            continue
        cat = test.get("category", "stale")
        if cat not in ("stale", "contradiction", "privacy", "forget", "unsupported", "premise", "freshness"):
            cat = "stale"
        tests.append({
            "id": f"test-{i + 1}",
            "title": (test.get("title") or f"Check {i + 1}")[:120],
            "category": cat,
            "question": q[:500],
            "expected": exp[:500],
            "severity": test.get("severity", "medium"),
            "evidenceIds": test.get("evidenceIds") or ([evidence[0]["id"]] if evidence else []),
            "repairAction": "forget" if cat in ("privacy", "forget") else "improve",
            "weight": round(1.0 / max(len(tests_in), 1), 2),
        })
    if evidence and not tests:
        tests.append({
            "id": "test-1",
            "title": "Grounded recall",
            "category": "stale",
            "question": f"What is the purpose of {name}?",
            "expected": purpose[:300],
            "severity": "high",
            "evidenceIds": [evidence[0]["id"]],
            "repairAction": "improve",
            "weight": 1.0,
        })
    return {
        "agentName": name,
        "purpose": purpose,
        "persona": persona,
        "evidence": evidence,
        "tests": tests,
    }


def build_case_from_scaffold(
    scaffold: Dict[str, Any],
    *,
    case_id: Optional[str] = None,
    owner_id: Optional[str] = None,
    llm_provider: Optional[str] = None,
    llm_model: Optional[str] = None,
    model_tier: Optional[str] = None,
) -> Dict[str, Any]:
    norm = _normalize_scaffold(scaffold)
    if not norm["evidence"]:
        raise ValueError("Add at least one real fact before creating the agent")
    cid = case_id or new_id("case")
    name = norm["agentName"]
    return {
        "id": cid,
        "name": name,
        "agent": name,
        "dataset": f"memgateqa_{slugify(name)}",
        "description": norm["purpose"],
        "persona": norm["persona"],
        "status": "open",
        "agentStatus": "draft",
        "visibility": "private",
        "ownerId": owner_id,
        "templateId": "from_chat",
        "llmProvider": llm_provider,
        "llmModel": llm_model,
        "modelTier": model_tier or "balanced",
        "modalities": ["text", "graph-recall"],
        "chatHistory": [],
        "evidence": norm["evidence"],
        "tests": norm["tests"],
        "resultsBefore": [],
        "resultsAfter": [],
        "reports": [],
        "cogneeDataIds": {},
        "builderScaffold": norm,
    }


async def builder_chat_turn(
    messages: List[Dict[str, str]],
    *,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    model_tier: Optional[str] = None,
) -> Dict[str, Any]:
    llm_messages = [{"role": m["role"], "content": m["content"][:3000]} for m in messages[-16:] if m.get("content")]
    if not llm_messages:
        return {
            "reply": "Describe what you want this agent to remember — your product, policies, or docs. I'll build memory and tests from your words only.",
            "readyToCreate": False,
            "scaffold": None,
        }

    from model_tiers import resolve_tier_model

    p = provider or "openai"
    tier_cfg = resolve_tier_model(p, model_tier or "balanced", explicit_model=model)
    llm = await generate(
        llm_messages,
        system=BUILDER_SYSTEM,
        provider=p,
        model=tier_cfg["model"],
        temperature=tier_cfg["temperature"],
        max_tokens=tier_cfg["maxTokens"],
    )
    text = llm.get("text", "")
    scaffold = _parse_scaffold(text)
    reply = _reply_without_scaffold(text)

    ready = False
    norm = None
    if scaffold:
        norm = _normalize_scaffold(scaffold)
        ready = len(norm["evidence"]) >= 1 and bool(norm["agentName"])

    return {
        "reply": reply or text[:1500],
        "readyToCreate": ready,
        "scaffold": norm,
        "provider": llm.get("provider"),
        "model": llm.get("model"),
    }