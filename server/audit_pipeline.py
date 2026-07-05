"""Auto memory audit pipeline — INDEX → interrogate → loop (MCP / SDK / UI)."""

from __future__ import annotations

from collections.abc import Awaitable
from typing import Any, Callable, Dict, List

from loop_runner import pipeline_after_interrogate, pipeline_after_remember, run_full_loop
from storage import get_case

RecallFn = Callable[[str, str], Awaitable[tuple[str, List[Dict[str, Any]]]]]
InterrogateFn = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]
RememberFn = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]


async def auto_audit_case(
    case_id: str,
    *,
    recall_fn: RecallFn,
    remember_fn: RememberFn,
    interrogate_fn: InterrogateFn,
    force_reindex: bool = False,
) -> Dict[str, Any]:
    """Full autonomous audit: ensure Cognee index, run traps, execute QA loop."""
    case = get_case(case_id)
    if not case:
        return {"ok": False, "error": "Case not found"}

    steps: List[Dict[str, Any]] = []
    data_ids = case.get("cogneeDataIds") or {}
    has_indexed = bool(data_ids) and len(data_ids) >= len([e for e in case.get("evidence", []) if e.get("shouldRemember", True)])

    if case.get("evidence") and (force_reindex or not has_indexed):
        rem = await remember_fn(case_id, case)
        steps.append({"step": "remember", "stored": rem.get("stored", [])})
        case = get_case(case_id) or case

    if case.get("tests"):
        interrog = await interrogate_fn(case_id, case)
        steps.append({
            "step": "interrogate",
            "score": interrog.get("score"),
            "failures": sum(1 for r in interrog.get("results", []) if r.get("status") == "fail"),
        })
        case = get_case(case_id) or case
        pipe = await pipeline_after_interrogate(case_id, case, recall_fn)
        steps.append({"step": "pipeline", "detail": pipe})
    elif case.get("evidence"):
        pipe = await pipeline_after_remember(case_id, case, recall_fn)
        steps.append({"step": "pipeline", "detail": pipe})

    case = get_case(case_id) or case
    loop = await run_full_loop(case, recall_fn, stop_at_plan=True)
    steps.append({"step": "full_loop", "health": loop.get("health"), "shipReady": loop.get("shipReady")})

    fresh = get_case(case_id) or case
    return {
        "ok": True,
        "caseId": case_id,
        "steps": steps,
        "health": fresh.get("lastScore"),
        "shipReady": (fresh.get("lastScore") or 0) >= 80,
        "pendingRepairPlan": fresh.get("pendingRepairPlan"),
        "status": fresh.get("status"),
    }