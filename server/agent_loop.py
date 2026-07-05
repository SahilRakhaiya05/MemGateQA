"""MemGate QA agent loop — loop-engineering pattern with native memory engine."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional

from agent_templates import agent_system_prompt, get_template
from llm_providers import generate
from workspace_settings import resolve_llm
from loop_store import LOOP_STEPS, append_ledger, get_ledger, get_state, sync_from_case, to_loop_md, to_state_md
from memgate_memory import (
    build_context,
    container_tag_for_case,
    get_profile,
    search_hybrid,
)
from storage import get_case, upsert_case

RecallFn = Callable[[str, str], Awaitable[tuple[str, List[Dict[str, Any]]]]]

CHAT_HISTORY_MAX = 40


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def loop_state(case: Dict[str, Any]) -> Dict[str, Any]:
    data = sync_from_case(case)
    return {
        "caseId": case.get("id"),
        "status": data["state"].get("status"),
        "health": data["state"].get("health"),
        "trapCount": data["state"].get("trapCount"),
        "failCount": data["state"].get("failCount"),
        "shipReady": data["state"].get("shipReady"),
        "loopReadyScore": data["state"].get("loopReadyScore"),
        "lastStep": data["state"].get("lastStep"),
        "steps": LOOP_STEPS,
        "loop": data["loop"],
        "ledgerPreview": get_ledger(case["id"], limit=5),
        "stateMd": to_state_md(case),
        "loopMd": to_loop_md(case["id"]),
    }


def chat_history(case: Dict[str, Any], limit: int = 30) -> List[Dict[str, Any]]:
    return list((case.get("chatHistory") or [])[-limit:])


def _append_chat(case_id: str, entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    case = get_case(case_id)
    if not case:
        return []
    hist = list(case.get("chatHistory") or [])
    hist.append(entry)
    case["chatHistory"] = hist[-CHAT_HISTORY_MAX:]
    upsert_case(case)
    return case["chatHistory"]


async def agent_chat(
    case: Dict[str, Any],
    message: str,
    recall_fn: RecallFn,
    *,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    dataset = case.get("dataset", "default_dataset")
    tag = container_tag_for_case(case["id"])
    hybrid = await search_hybrid(tag, message, dataset=dataset, recall_fn=recall_fn, mode="hybrid")
    memory_context, hits = await recall_fn(message, dataset)
    profile = get_profile(tag, query=message)
    context_block = build_context(tag, case_name=case.get("name", ""), health=case.get("lastScore"))

    local_snippet = "\n".join(r["text"][:220] for r in hybrid.get("results", [])[:4])
    refs: List[Dict[str, Any]] = []
    for hit in hits[:4]:
        for ref in hit.get("references", []) or hit.get("citations", []) or []:
            if isinstance(ref, dict):
                refs.append(ref)

    memory_block = (
        f"=== COGNEE RECALL (query: {message[:120]}) ===\n"
        f"{memory_context[:2400] or '(empty — run remember() first)'}\n\n"
        f"=== MEMGATE HYBRID ===\n{local_snippet or '(no local hits)'}\n\n"
        f"=== CASE CONTEXT ===\n{context_block[:800]}"
    )

    llm_cfg = resolve_llm(case)
    system = agent_system_prompt(case)

    llm_messages: List[Dict[str, str]] = []
    prior = history if history is not None else chat_history(case, limit=12)
    for h in prior[-12:]:
        role = h.get("role", "user")
        if role not in ("user", "assistant"):
            role = "user" if role == "user" else "assistant"
        content = (h.get("content") or h.get("text") or "")[:2000]
        if content:
            llm_messages.append({"role": role, "content": content})

    llm_messages.append({
        "role": "user",
        "content": f"{memory_block}\n\n---\nUser question: {message}",
    })

    _append_chat(case["id"], {"role": "user", "content": message, "t": _now()})

    llm = await generate(
        llm_messages,
        system=system,
        provider=llm_cfg["provider"],
        model=llm_cfg["model"],
        temperature=llm_cfg.get("temperature", 0.2),
        max_tokens=llm_cfg.get("maxTokens", 2000),
    )

    answer = llm.get("text", "")
    _append_chat(case["id"], {
        "role": "assistant",
        "content": answer,
        "t": _now(),
        "provider": llm.get("provider"),
        "model": llm.get("model"),
        "recallPreview": memory_context[:400],
    })
    append_ledger(case["id"], {
        "op": "agent_chat",
        "message": message[:120],
        "provider": llm.get("provider"),
        "model": llm.get("model"),
        "tier": llm_cfg.get("tier"),
    })

    tpl = get_template(case.get("templateId", "support"))
    return {
        "answer": answer,
        "provider": llm.get("provider"),
        "model": llm.get("model"),
        "tier": llm_cfg.get("tier"),
        "recallPreview": memory_context[:500],
        "hybridResults": hybrid.get("results", [])[:5],
        "profile": profile["profile"],
        "references": refs[:5] or hits[:3],
        "chatPrompts": tpl.get("chatPrompts", [])[:4],
        "historyLength": len(chat_history(get_case(case["id"]) or case)),
    }


async def gap_fill_plan(case: Dict[str, Any], failures: List[Dict[str, Any]]) -> Dict[str, Any]:
    lines = []
    for f in failures[:8]:
        test = next((t for t in case.get("tests", []) if t["id"] == f.get("testId")), None)
        if test:
            lines.append(f"- [{test.get('category')}] {test.get('title')}: expected «{test.get('expected', '')[:80]}»")
    prompt = (
        "Generate a human-approved memory surgery plan for these failed trap tests. "
        "Use Cognee lifecycle: remember(), recall(), improve(), forget().\n"
        + "\n".join(lines)
    )
    llm_cfg = resolve_llm(case)
    llm = await generate(
        [{"role": "user", "content": prompt}],
        system="You are a Cognee memory repair architect. Output numbered steps only.",
        provider=llm_cfg["provider"],
        model=llm_cfg["model"],
        temperature=llm_cfg.get("temperature", 0.15),
        max_tokens=llm_cfg.get("maxTokens", 3000),
    )
    append_ledger(case["id"], {"stepId": "plan", "op": "gap_fill", "failureCount": len(failures)})
    return {"plan": llm["text"], "provider": llm.get("provider"), "failureCount": len(failures)}


async def run_loop_tick(
    case: Dict[str, Any],
    step_id: str,
    *,
    recall_fn: Optional[RecallFn] = None,
) -> Dict[str, Any]:
    step = next((s for s in LOOP_STEPS if s["id"] == step_id), None)
    if not step:
        return {"error": f"Unknown step {step_id}"}
    state = loop_state(case)
    tag = container_tag_for_case(case["id"])
    dataset = case.get("dataset", "default_dataset")
    detail = f"Step {step['label']} ({step['op']}) — health {state['health']}% · {state['failCount']} failures"

    if step_id == "observe":
        evidence_n = len(case.get("evidence", []))
        tests_n = len(case.get("tests", []))
        detail = (
            f"Audit: {evidence_n} evidence packets · {tests_n} traps · "
            f"health {state['health']}% · {state['failCount']} open failures · "
            f"loop ready {state['loopReadyScore']}/100"
        )
    elif step_id == "recall" and recall_fn:
        q = case["tests"][0].get("question", "What is the current architecture?") if case.get("tests") else "Summarize case memory"
        hybrid = await search_hybrid(tag, q, dataset=dataset, recall_fn=recall_fn)
        detail = f"Hybrid recall ({hybrid.get('localCount', 0)} local + Cognee): " + (
            hybrid["results"][0]["text"][:400] if hybrid.get("results") else "(empty — run INDEX first)"
        )
    elif step_id == "grade":
        before = case.get("resultsBefore") or []
        fails = [r for r in before if r.get("status") == "fail"]
        detail = f"Trap suite: {len(before)} run · {len(fails)} fail · score {state['health']}%"
        if fails:
            detail += "\n" + "\n".join(
                f"  ✗ {next((t['title'] for t in case.get('tests', []) if t['id'] == f.get('testId')), f.get('testId'))}"
                for f in fails[:5]
            )
    elif step_id == "plan" and state["failCount"] > 0:
        failures = [r for r in (case.get("resultsBefore") or []) if r.get("status") == "fail"]
        plan = await gap_fill_plan(case, failures)
        detail = plan["plan"][:800]
    elif step_id == "verify":
        after = case.get("resultsAfter") or []
        before = case.get("resultsBefore") or []
        if after:
            b_score = case.get("lastScore")
            detail = f"Verify: post-repair score {b_score}% · ship ready {state['shipReady']}"
        elif before:
            detail = f"Verify blocked: run memory surgery first ({state['failCount']} failures remain)"
        else:
            detail = "Verify blocked: run interrogation first"

    append_ledger(case["id"], {"stepId": step_id, "label": step["label"], "detail": detail[:300]})
    sync_from_case(case)
    return {
        "step": step,
        "state": loop_state(case),
        "detail": detail,
        "humanGate": step_id in get_state(case["id"])["loop"].get("humanGateSteps", []),
    }