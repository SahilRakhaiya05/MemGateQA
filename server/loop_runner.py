"""Auto loop runner — full observe→recall→grade→plan→verify cycles + background scheduler."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, List, Optional

from agent_loop import gap_fill_plan, run_loop_tick
from loop_store import LOOP_STEPS, append_ledger, get_state, sync_from_case
from memgate_memory import index_case_evidence
from storage import get_case, upsert_case

RecallFn = Callable[[str, str], Awaitable[tuple[str, List[Dict[str, Any]]]]]

_auto_tasks: Dict[str, asyncio.Task] = {}
_auto_config: Dict[str, Dict[str, Any]] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def default_interval() -> int:
    return int(os.getenv("MEMGATEQA_LOOP_INTERVAL_SEC", "120"))


def auto_status(case_id: str) -> Dict[str, Any]:
    cfg = _auto_config.get(case_id, {})
    task = _auto_tasks.get(case_id)
    running = task is not None and not task.done()
    return {
        "caseId": case_id,
        "running": running,
        "intervalSec": cfg.get("intervalSec", default_interval()),
        "lastRunAt": cfg.get("lastRunAt"),
        "lastResult": cfg.get("lastResult"),
        "runCount": cfg.get("runCount", 0),
        "nextStep": cfg.get("nextStep"),
    }


async def run_full_loop(
    case: Dict[str, Any],
    recall_fn: RecallFn,
    *,
    stop_at_plan: bool = True,
) -> Dict[str, Any]:
    """Run all loop steps in sequence. Stops at plan if failures need human surgery."""
    ticks: List[Dict[str, Any]] = []
    pending_plan: Optional[str] = None

    for step in LOOP_STEPS:
        tick = await run_loop_tick(case, step["id"], recall_fn=recall_fn)
        if tick.get("error"):
            return {"ok": False, "error": tick["error"], "ticks": ticks}
        ticks.append({"stepId": step["id"], "detail": tick.get("detail", "")[:400]})

        if step["id"] == "plan" and tick.get("detail"):
            pending_plan = tick["detail"]
            if stop_at_plan:
                break

    case = get_case(case["id"]) or case
    if pending_plan:
        case["pendingRepairPlan"] = pending_plan
        case["pendingPlanAt"] = _now()
        upsert_case(case)

    state = sync_from_case(case)
    append_ledger(case["id"], {
        "op": "full_loop",
        "steps": len(ticks),
        "health": state["state"].get("health"),
        "shipReady": state["state"].get("shipReady"),
    })

    return {
        "ok": True,
        "ticks": ticks,
        "pendingPlan": pending_plan,
        "shipReady": state["state"].get("shipReady"),
        "health": state["state"].get("health"),
        "loopReadyScore": state["state"].get("loopReadyScore"),
    }


async def _auto_loop_cycle(case_id: str, recall_fn: RecallFn) -> None:
    case = get_case(case_id)
    if not case:
        return
    result = await run_full_loop(case, recall_fn, stop_at_plan=True)
    cfg = _auto_config.setdefault(case_id, {"intervalSec": default_interval(), "runCount": 0})
    cfg["lastRunAt"] = _now()
    cfg["lastResult"] = result
    cfg["runCount"] = cfg.get("runCount", 0) + 1
    cfg["nextStep"] = "observe" if not result.get("shipReady") else "idle"

    if result.get("shipReady"):
        append_ledger(case_id, {"op": "auto_loop", "detail": "Ship ready — auto loop pausing recommendation"})
        await stop_auto_loop(case_id)


async def _auto_worker(case_id: str, interval: int, recall_fn: RecallFn) -> None:
    while case_id in _auto_config and _auto_config[case_id].get("running"):
        try:
            await _auto_loop_cycle(case_id, recall_fn)
        except Exception as exc:
            append_ledger(case_id, {"op": "auto_loop_error", "detail": str(exc)[:200]})
        await asyncio.sleep(interval)


async def start_auto_loop(case_id: str, recall_fn: RecallFn, interval: Optional[int] = None) -> Dict[str, Any]:
    await stop_auto_loop(case_id)
    sec = interval or default_interval()
    _auto_config[case_id] = {
        "running": True,
        "intervalSec": sec,
        "startedAt": _now(),
        "runCount": 0,
    }
    task = asyncio.create_task(_auto_worker(case_id, sec, recall_fn))
    _auto_tasks[case_id] = task
    append_ledger(case_id, {"op": "auto_loop_start", "intervalSec": sec})
    return auto_status(case_id)


async def stop_auto_loop(case_id: str) -> Dict[str, Any]:
    _auto_config.pop(case_id, None)
    task = _auto_tasks.pop(case_id, None)
    if task and not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    append_ledger(case_id, {"op": "auto_loop_stop"})
    return auto_status(case_id)


async def pipeline_after_remember(case_id: str, case: Dict[str, Any], recall_fn: RecallFn) -> Dict[str, Any]:
    """Auto-sync memory index + observe/recall loop ticks after INDEX."""
    index_case_evidence(case)
    await run_loop_tick(case, "observe", recall_fn=recall_fn)
    await run_loop_tick(case, "recall", recall_fn=recall_fn)
    sync_from_case(case)
    return {"synced": True, "container": case.get("memgateContainer")}


async def pipeline_after_interrogate(case_id: str, case: Dict[str, Any], recall_fn: RecallFn) -> Dict[str, Any]:
    """Auto grade + plan generation after interrogation."""
    grade = await run_loop_tick(case, "grade", recall_fn=recall_fn)
    plan_tick: Optional[Dict[str, Any]] = None
    fails = [r for r in (case.get("resultsBefore") or []) if r.get("status") == "fail"]
    if fails:
        plan = await gap_fill_plan(case, fails)
        plan_tick = {"stepId": "plan", "detail": plan["plan"][:800]}
        fresh = get_case(case_id) or case
        fresh["pendingRepairPlan"] = plan["plan"]
        fresh["pendingPlanAt"] = _now()
        upsert_case(fresh)
    sync_from_case(get_case(case_id) or case)
    return {"grade": grade.get("detail", ""), "plan": plan_tick, "failureCount": len(fails)}