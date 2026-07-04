"""Loop-engineering inspired QA agent — observe → recall → grade → plan → verify."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional

from llm_providers import generate

RecallFn = Callable[[str, str], Awaitable[tuple[str, List[Dict[str, Any]]]]]

LOOP_STEPS = [
    {"id": "observe", "label": "Observe", "op": "audit"},
    {"id": "recall", "label": "Recall", "op": "recall()"},
    {"id": "grade", "label": "Grade", "op": "trap suite"},
    {"id": "plan", "label": "Plan", "op": "LLM repair"},
    {"id": "verify", "label": "Verify", "op": "rerun + lint"},
]


def loop_state(case: Dict[str, Any]) -> Dict[str, Any]:
    before = case.get("resultsBefore") or []
    after = case.get("resultsAfter") or []
    active = after if after else before
    fails = [r for r in active if r.get("status") == "fail"]
    return {
        "caseId": case.get("id"),
        "status": case.get("status"),
        "health": case.get("lastScore"),
        "trapCount": len(case.get("tests") or []),
        "failCount": len(fails),
        "shipReady": (case.get("lastScore") or 0) >= 80,
        "steps": LOOP_STEPS,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


async def agent_chat(
    case: Dict[str, Any],
    message: str,
    recall_fn: RecallFn,
) -> Dict[str, Any]:
    dataset = case.get("dataset", "default_dataset")
    memory_context, hits = await recall_fn(message, dataset)
    supermemory_snippet = ""
    try:
        from supermemory_adapter import enabled, search_memory

        if enabled():
            sm = await search_memory(message, f"memgateqa_{case.get('id')}")
            if sm.get("ok") and sm.get("results"):
                supermemory_snippet = str(sm["results"][:2])
    except Exception:
        pass

    system = (
        "You are MemGateQA, a memory QA agent. You gate agent memory before production deploy. "
        "Use Cognee recall context. Be concise. Recommend remember/recall/improve/forget when relevant. "
        "Never auto-mutate memory — human approval required for surgery."
    )
    user_prompt = (
        f"Case: {case.get('name')}\n"
        f"Health: {case.get('lastScore')}% · Status: {case.get('status')}\n"
        f"Cognee recall:\n{memory_context}\n"
        f"Supermemory (optional):\n{supermemory_snippet or '(not connected)'}\n\n"
        f"User: {message}"
    )
    llm = await generate([{"role": "user", "content": user_prompt}], system=system)
    return {
        "answer": llm["text"],
        "provider": llm.get("provider"),
        "model": llm.get("model"),
        "recallPreview": memory_context[:500],
        "references": hits[:3],
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
    llm = await generate(
        [{"role": "user", "content": prompt}],
        system="You are a Cognee memory repair architect. Output numbered steps only.",
    )
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
    detail = f"Step {step['label']} ({step['op']}) — health {state['health']}% · {state['failCount']} failures"
    if step_id == "plan" and state["failCount"] > 0:
        failures = [r for r in (case.get("resultsBefore") or []) if r.get("status") == "fail"]
        plan = await gap_fill_plan(case, failures)
        detail = plan["plan"][:800]
    elif step_id == "recall" and recall_fn and case.get("tests"):
        q = case["tests"][0].get("question", "What is the current architecture?")
        ans, _ = await recall_fn(q, case.get("dataset", ""))
        detail = f"Sample recall: {ans[:400]}"
    return {"step": step, "state": state, "detail": detail}