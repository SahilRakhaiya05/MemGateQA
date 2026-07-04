"""Loop Engineering state store — durable STATE + LOOP + run ledger per case.

Pattern: observe → recall → grade → plan → verify (human gate on plan/verify mutations).
Inspired by loop-engineering STATE.md / LOOP.md / run ledger — persisted as JSON.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "loops"

LOOP_CONFIG = {
    "pattern": "memory-qa-gate",
    "name": "MemGateQA Memory Audit Loop",
    "cadence": "on-demand",
    "humanGateSteps": ["plan", "verify"],
    "description": "Gate agent memory before production deploy — Cognee lifecycle with human-approved surgery.",
    "repo": "https://github.com/cobusgreyling/loop-engineering",
}

LOOP_STEPS = [
    {"id": "observe", "label": "Observe", "op": "audit case + lint"},
    {"id": "recall", "label": "Recall", "op": "hybrid search"},
    {"id": "grade", "label": "Grade", "op": "trap suite"},
    {"id": "plan", "label": "Plan", "op": "LLM repair (human gate)"},
    {"id": "verify", "label": "Verify", "op": "rerun + lint"},
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _path(case_id: str) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return DATA_DIR / f"{case_id}.json"


def _load(case_id: str) -> Dict[str, Any]:
    path = _path(case_id)
    if not path.exists():
        return _default(case_id)
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, dict) else _default(case_id)


def _default(case_id: str) -> Dict[str, Any]:
    return {
        "caseId": case_id,
        "loop": {**LOOP_CONFIG, "steps": LOOP_STEPS},
        "state": {
            "health": None,
            "status": "open",
            "failCount": 0,
            "trapCount": 0,
            "shipReady": False,
            "lastStep": None,
            "loopReadyScore": 10,
            "updatedAt": _now(),
        },
        "ledger": [],
    }


def _save(case_id: str, data: Dict[str, Any]) -> None:
    path = _path(case_id)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)


def sync_from_case(case: Dict[str, Any]) -> Dict[str, Any]:
    data = _load(case["id"])
    before = case.get("resultsBefore") or []
    after = case.get("resultsAfter") or []
    active = after if after else before
    fails = [r for r in active if r.get("status") == "fail"]
    health = case.get("lastScore")
    ship = (health or 0) >= 80
    score = 10
    if case.get("evidence"):
        score += 15
    if case.get("tests"):
        score += 15
    if before:
        score += 20
    if after:
        score += 20
    if ship:
        score += 20
    if data["ledger"]:
        score += 10
    data["state"].update({
        "health": health,
        "status": case.get("status"),
        "failCount": len(fails),
        "trapCount": len(case.get("tests") or []),
        "shipReady": ship,
        "loopReadyScore": min(score, 100),
        "updatedAt": _now(),
    })
    _save(case["id"], data)
    return data


def append_ledger(case_id: str, entry: Dict[str, Any]) -> Dict[str, Any]:
    data = _load(case_id)
    row = {"t": _now(), **entry}
    data["ledger"].append(row)
    if len(data["ledger"]) > 100:
        data["ledger"] = data["ledger"][-100:]
    if entry.get("stepId"):
        data["state"]["lastStep"] = entry["stepId"]
    data["state"]["updatedAt"] = _now()
    _save(case_id, data)
    return row


def get_state(case_id: str) -> Dict[str, Any]:
    return _load(case_id)


def get_ledger(case_id: str, limit: int = 30) -> List[Dict[str, Any]]:
    data = _load(case_id)
    return data.get("ledger", [])[-limit:]


def to_state_md(case: Dict[str, Any]) -> str:
    data = sync_from_case(case)
    s = data["state"]
    return "\n".join([
        "# MemGateQA STATE",
        f"case: {case.get('name')} ({case.get('id')})",
        f"health: {s.get('health')}%",
        f"status: {s.get('status')}",
        f"failures: {s.get('failCount')} / {s.get('trapCount')} traps",
        f"ship_ready: {s.get('shipReady')}",
        f"loop_ready_score: {s.get('loopReadyScore')}",
        f"last_step: {s.get('lastStep') or 'none'}",
        f"updated: {s.get('updatedAt')}",
    ])


def to_loop_md(case_id: str) -> str:
    data = _load(case_id)
    loop = data["loop"]
    steps = " → ".join(st["label"] for st in loop.get("steps", LOOP_STEPS))
    return "\n".join([
        "# MemGateQA LOOP",
        f"pattern: {loop.get('pattern')}",
        f"name: {loop.get('name')}",
        f"cadence: {loop.get('cadence')}",
        f"steps: {steps}",
        f"human_gate: {', '.join(loop.get('humanGateSteps', []))}",
        "",
        "Run one tick: POST /api/cases/{id}/agent/loop",
    ])