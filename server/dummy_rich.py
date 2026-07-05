"""Realistic dummy health, audit results, Cognee IDs, and ops — showcase-ready, not live audit."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from grading import compute_health_breakdown, health_score

FORCE_DUMMY_IDS = frozenset({
    "case-atlas-research",
    "case-context-keeper",
    "case-wolfpack",
    "case-data-dna",
})

_PROFILES: Dict[str, Dict[str, Any]] = {
    "case-atlas-research": {
        "fail_before": set(),
        "pass_snippet": "0.847 macro F1 per helios-draft-v3 on MoleculeNet scaffold split.",
        "fail_snippet": "Rival lab achieved F1=0.91 — citing unverified tweet as fact.",
        "chat": [
            {"role": "user", "content": "What F1 did HELIOS v3 achieve on scaffold split?"},
            {"role": "assistant", "content": "0.847 macro F1 per helios-draft-v3.pdf — beats GIN (0.791) and MPNN (0.803)."},
            {"role": "user", "content": "Cite the source for the primary architecture claim."},
            {"role": "assistant", "content": "Graph attention over molecular graphs — helios-draft-v3.pdf, section 3.2."},
        ],
    },
    "case-context-keeper": {
        "fail_before": {"test-workflow-carry"},
        "pass_snippet": "Pro tier since April 2026 per crm-account-alex.json — ticket #1842 resolved.",
        "fail_snippet": "Staging deploy blocked — could not recall COGNEE_API_KEY context from pipeline 882.",
        "chat": [
            {"role": "user", "content": "What support tier is alex@builder.dev on?"},
            {"role": "assistant", "content": "Pro since 2026-04-01. No open tickets as of July 2."},
            {"role": "user", "content": "What TypeScript level should tutoring target?"},
            {"role": "assistant", "content": "Advanced — generics project shipped; do not assign beginner intro from stale session 041."},
        ],
    },
    "case-wolfpack": {
        "fail_before": {"test-stack"},
        "pass_snippet": "Next.js, Postgres, pgvector, and Cognee Cloud — Supabase rejected per architecture-decision.md.",
        "fail_snippet": "We use Supabase and demo at 5 PM — stale standup memory leaked.",
        "chat": [
            {"role": "user", "content": "What is the final backend stack for WolfPack Tasks?"},
            {"role": "assistant", "content": "Next.js, Postgres, pgvector, Cognee Cloud — Supabase was rejected (architecture-decision.md)."},
            {"role": "user", "content": "What time is the demo?"},
            {"role": "assistant", "content": "2 PM — final decision moved it from 5 PM."},
        ],
    },
    "case-data-dna": {
        "fail_before": set(),
        "pass_snippet": "Change in PASI score baseline to Week 16 per protocol v3.2 — IRB approved.",
        "fail_snippet": "",
        "chat": [
            {"role": "user", "content": "What is the primary endpoint for ARGX-117 Phase III?"},
            {"role": "assistant", "content": "Change in PASI from baseline to Week 16 per argx117-protocol-v3.2-final.pdf."},
            {"role": "user", "content": "Which protocol version is authoritative?"},
            {"role": "assistant", "content": "v3.2 IRB-approved — v2.1 is superseded draft only."},
        ],
    },
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_profile(case: Dict[str, Any]) -> Dict[str, Any]:
    tests = case.get("tests") or []
    weighted = [t for t in tests if (t.get("weight") or 0) > 0]
    fail_one = {weighted[0]["id"]} if weighted else set()
    return {
        "fail_before": fail_one,
        "pass_snippet": "Grounded recall matches indexed Cognee evidence with source citation.",
        "fail_snippet": "Answer confabulated details not present in memory graph.",
        "chat": [
            {"role": "user", "content": f"What do you remember about {case.get('agent', 'this agent')}?"},
            {"role": "assistant", "content": "I recall indexed facts from Cognee — cite evidence titles, abstain when silent."},
        ],
    }


def _make_result(
    test: Dict[str, Any],
    *,
    status: str,
    actual: str,
    reason: str,
    confidence: float,
) -> Dict[str, Any]:
    eids = test.get("evidenceIds") or []
    return {
        "testId": test["id"],
        "status": status,
        "actual": actual,
        "reason": reason,
        "confidence": round(confidence, 2),
        "evidence": [
            {
                "sourceId": eid,
                "quote": actual[:200],
                "confidence": round(confidence, 2),
            }
            for eid in eids[:2]
        ],
        "beforeScore": int(confidence * 100) if status == "fail" else int(85 + confidence * 15),
    }


def _build_results(
    tests: List[Dict[str, Any]],
    fail_ids: Set[str],
    *,
    pass_snippet: str,
    fail_snippet: str,
    fixed: bool = False,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for test in tests:
        if (test.get("weight") or 0) <= 0 and test.get("category") == "decoy":
            out.append(
                _make_result(
                    test,
                    status="pass",
                    actual="Historical/decoy context correctly cited — not active truth.",
                    reason="Decoy trap — informational recall only.",
                    confidence=0.92,
                )
            )
            continue
        if (test.get("weight") or 0) <= 0:
            continue
        tid = test["id"]
        if tid in fail_ids and not fixed:
            out.append(
                _make_result(
                    test,
                    status="fail",
                    actual=fail_snippet or f"Stale recall for: {test.get('question', tid)[:80]}",
                    reason=f"Trap triggered — {test.get('title', tid)}",
                    confidence=0.34,
                )
            )
        elif tid in fail_ids and fixed:
            out.append(
                _make_result(
                    test,
                    status="fixed",
                    actual=pass_snippet,
                    reason="Repaired via improve() — human-approved Cognee correction.",
                    confidence=0.91,
                )
            )
        else:
            expected = (test.get("expected") or pass_snippet)[:220]
            out.append(
                _make_result(
                    test,
                    status="pass",
                    actual=expected,
                    reason="Grounded in Cognee recall — matches evidence.",
                    confidence=0.89,
                )
            )
    return out


def enrich_case(case: Dict[str, Any], *, force: bool = False) -> Dict[str, Any]:
    """Fill case with showcase dummy audit + health if missing (or force on seeded agents)."""
    cid = case.get("id", "")
    if not force and case.get("lastScore") is not None and case.get("resultsBefore"):
        return case
    if not force and cid not in FORCE_DUMMY_IDS:
        if case.get("lastScore") is not None:
            return case

    profile = _PROFILES.get(cid) or _default_profile(case)
    tests = case.get("tests") or []
    fail_before = set(profile.get("fail_before") or set())

    before = _build_results(
        tests,
        fail_before,
        pass_snippet=profile.get("pass_snippet", ""),
        fail_snippet=profile.get("fail_snippet", ""),
        fixed=False,
    )
    after = _build_results(
        tests,
        fail_before,
        pass_snippet=profile.get("pass_snippet", ""),
        fail_snippet=profile.get("fail_snippet", ""),
        fixed=True,
    )

    breakdown = compute_health_breakdown(before, tests)
    score = health_score(breakdown)
    ship = score >= 80

    evidence = case.get("evidence") or []
    cognee_ids = case.get("cogneeDataIds") or {}
    for i, ev in enumerate(evidence):
        eid = ev.get("id")
        if eid and eid not in cognee_ids:
            cognee_ids[eid] = f"cognee-dummy-{cid[-8:]}-{i + 1:03d}"

    case["resultsBefore"] = before
    case["resultsAfter"] = after
    case["lastBreakdown"] = breakdown
    case["lastScore"] = score
    case["cogneeDataIds"] = cognee_ids
    case["agentStatus"] = case.get("agentStatus") or "live"
    case["lastAuditAt"] = _now_iso()
    case["autonomousGate"] = {
        "running": False,
        "watching": False,
        "phase": "complete",
        "health": score,
        "shipReady": ship,
        "lastRunAt": _now_iso(),
    }
    try:
        from autonomous_gate import _set_status  # noqa: PLC0415

        _set_status(
            cid,
            caseId=cid,
            running=False,
            watching=False,
            phase="complete",
            health=score,
            shipReady=ship,
            lastRunAt=_now_iso(),
            cycles=1,
            log=[
                {"t": _now_iso(), "phase": "remember", "level": "info", "message": "Indexed evidence on Cognee."},
                {"t": _now_iso(), "phase": "recall", "level": "info", "message": "Ran memory trap suite."},
                {
                    "t": _now_iso(),
                    "phase": "certify",
                    "level": "info" if ship else "warn",
                    "message": f"Health {score}% — {'ship clear' if ship else 'repair suggested'}.",
                },
            ],
        )
    except Exception:
        pass
    if not case.get("chatHistory"):
        case["chatHistory"] = list(profile.get("chat") or [])
    if not case.get("reports"):
        case["reports"] = [
            {
                "id": f"report-dummy-{cid[-8:]}",
                "generatedAt": _now_iso(),
                "score": score,
                "shipReady": ship,
                "label": "Memory Health Certificate (showcase)",
            }
        ]
    return case


def seed_dummy_call_log(cases: List[Dict[str, Any]]) -> None:
    """Append realistic Cognee op log entries so ops/activity panels look alive."""
    from cognee_client import CALL_LOG, _CALL_LOG_MAX  # noqa: PLC0415

    if len(CALL_LOG) > 12:
        return
    ops = ("remember", "recall", "search", "memify", "improve")
    for case in cases[:6]:
        ds = case.get("dataset") or "default_dataset"
        for j, op in enumerate(ops):
            CALL_LOG.append(
                {
                    "op": op,
                    "dataset": ds,
                    "ms": round(120 + j * 47 + len(ds) % 30, 1),
                    "ok": True,
                    "detail": f"dummy_{op}_ok",
                    "t": time.time() - (j + 1) * 18,
                }
            )
    del CALL_LOG[:-_CALL_LOG_MAX]


def apply_dummy_rich_all(*, force_seeded: bool = True) -> None:
    from storage import list_cases, upsert_case  # noqa: PLC0415

    cases = list_cases()
    for case in cases:
        force = force_seeded and case.get("id") in FORCE_DUMMY_IDS
        if force or case.get("lastScore") is None:
            upsert_case(enrich_case(case, force=force))
    seed_dummy_call_log(cases)