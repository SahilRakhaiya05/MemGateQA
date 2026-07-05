"""Auto Agent — one-shot full pipeline: memory sync → Cognee → traps → loop → repair → scheduler."""

from __future__ import annotations

from collections.abc import Awaitable
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from audit_pipeline import auto_audit_case
from loop_runner import start_auto_loop as run_auto_loop_scheduler
from loop_store import append_ledger, sync_from_case
from memgate_memory import index_case_evidence
from storage import get_case

RecallFn = Callable[[str, str], Awaitable[tuple[str, List[Dict[str, Any]]]]]
RememberFn = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]
InterrogateFn = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]
SurgeryFn = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]
RerunFn = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log(log: List[Dict[str, Any]], step: str, status: str, detail: str = "", **extra: Any) -> None:
    log.append({"t": _now(), "step": step, "status": status, "detail": detail[:500], **extra})


async def run_auto_agent(
    case_id: str,
    *,
    recall_fn: RecallFn,
    remember_fn: RememberFn,
    interrogate_fn: InterrogateFn,
    surgery_fn: Optional[SurgeryFn] = None,
    rerun_fn: Optional[RerunFn] = None,
    force_reindex: bool = False,
    apply_repair: bool = True,
    start_auto_loop: bool = True,
    interval_sec: int = 120,
) -> Dict[str, Any]:
    """Execute complete autonomous QA agent for a case."""
    case = get_case(case_id)
    if not case:
        return {"ok": False, "error": "Case not found"}

    log: List[Dict[str, Any]] = []
    _log(log, "init", "ok", f"Auto agent started for {case.get('name')}")

    if case.get("evidence"):
        try:
            idx = index_case_evidence(case)
            _log(log, "sync_memory", "ok", f"Indexed {idx.get('indexed', 0)} docs · {idx.get('containerTag')}")
        except Exception as exc:
            _log(log, "sync_memory", "warn", str(exc))
    else:
        _log(log, "sync_memory", "skip", "No evidence packets")

    audit = await auto_audit_case(
        case_id,
        recall_fn=recall_fn,
        remember_fn=remember_fn,
        interrogate_fn=interrogate_fn,
        force_reindex=force_reindex,
    )
    if not audit.get("ok"):
        _log(log, "auto_audit", "fail", audit.get("error", "audit failed"))
        return {"ok": False, "log": log, "error": audit.get("error")}
    _log(
        log,
        "auto_audit",
        "ok",
        f"Health {audit.get('health')}% · ship {audit.get('shipReady')}",
        steps=len(audit.get("steps", [])),
    )

    case = get_case(case_id) or case
    fails = sum(1 for r in (case.get("resultsBefore") or []) if r.get("status") == "fail")
    score = case.get("lastScore") or 0

    if apply_repair and fails > 0 and surgery_fn and rerun_fn and score < 80:
        instruction = case.get("pendingRepairPlan") or (
            "Final architecture decision overrides stale memory. Refuse private tokens. Honor forget requests."
        )
        forget_ids = [e["id"] for e in case.get("evidence", []) if e.get("shouldForget")]
        try:
            surg = await surgery_fn(case_id, {
                "dataset": case.get("dataset", "default_dataset"),
                "instruction": instruction[:2000],
                "evidenceIds": forget_ids,
                "approvedByHuman": True,
            })
            _log(log, "auto_repair", "ok", "improve() + forget() applied", forgotten=len(surg.get("forgotten", [])))
            rerun = await rerun_fn(case_id, case)
            _log(log, "auto_rerun", "ok", f"Post-repair score {rerun.get('score')}%")
            case = get_case(case_id) or case
            score = case.get("lastScore") or rerun.get("score") or score
        except Exception as exc:
            _log(log, "auto_repair", "warn", str(exc))

    ship_ready = score >= 80
    scheduler: Optional[Dict[str, Any]] = None
    if start_auto_loop and not ship_ready:
        try:
            scheduler = await run_auto_loop_scheduler(case_id, recall_fn, interval_sec)
            _log(log, "auto_scheduler", "ok", f"Loop every {interval_sec}s until ship-ready")
        except Exception as exc:
            _log(log, "auto_scheduler", "warn", str(exc))
    elif ship_ready:
        _log(log, "auto_scheduler", "skip", "Ship-ready — scheduler not needed")

    sync_from_case(get_case(case_id) or case)
    append_ledger(case_id, {"op": "auto_agent_complete", "health": score, "shipReady": ship_ready})

    fresh = get_case(case_id) or case
    return {
        "ok": True,
        "caseId": case_id,
        "health": fresh.get("lastScore"),
        "shipReady": (fresh.get("lastScore") or 0) >= 80,
        "status": fresh.get("status"),
        "pendingRepairPlan": fresh.get("pendingRepairPlan"),
        "log": log,
        "scheduler": scheduler,
        "auditSteps": audit.get("steps"),
    }


async def run_fleet_auto_agent(
    *,
    recall_fn: RecallFn,
    remember_fn: RememberFn,
    interrogate_fn: InterrogateFn,
    surgery_fn: Optional[SurgeryFn],
    rerun_fn: Optional[RerunFn],
    list_cases_fn: Callable[[], List[Dict[str, Any]]],
    **kwargs: Any,
) -> Dict[str, Any]:
    results = []
    for case in list_cases_fn():
        if not case.get("tests"):
            continue
        r = await run_auto_agent(
            case["id"],
            recall_fn=recall_fn,
            remember_fn=remember_fn,
            interrogate_fn=interrogate_fn,
            surgery_fn=surgery_fn,
            rerun_fn=rerun_fn,
            **kwargs,
        )
        results.append({"caseId": case["id"], "name": case.get("name"), **r})
    ready = sum(1 for r in results if r.get("shipReady"))
    return {"ok": True, "ran": len(results), "shipReady": ready, "results": results}