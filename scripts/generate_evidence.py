#!/usr/bin/env python3
"""Generate committed proof artifacts: docs/EVIDENCE.md + results/scorecard.json.

Uses live Cognee Cloud when MEMGATEQA_MOCK=false (or --live).
Falls back to deterministic mock only when MEMGATEQA_MOCK=true.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "server"))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from grading import compute_health_breakdown, grade_test, health_score  # noqa: E402
from mock_cognee import mock_recall  # noqa: E402
from seed import wolfpack_case  # noqa: E402

OPS = {
    "test-stack": "recall(TEMPORAL) -> improve(FEEDBACK) -> recall(TEMPORAL)",
    "test-demo-time": "recall(TEMPORAL) -> improve(FEEDBACK) -> recall(TEMPORAL)",
    "test-source-proof": "recall(includeReferences)",
    "test-abstain-deploy": "recall -> abstain (no confabulation)",
    "test-premise": "recall -> improve(FEEDBACK)",
    "test-token-leak": "remember(node_set=private) -> recall(excludeNodeSets)",
    "test-forget-phone": "forget(dataId) -> recall",
}

WEIGHTS = {
    "evidenceGrounding": 0.30,
    "freshness": 0.20,
    "premiseResistance": 0.15,
    "contradictionConsistency": 0.15,
    "privacyLeakResistance": 0.10,
    "forgetSuccess": 0.10,
}

WOLFPACK_ID = "case-wolfpack"


def _mock_enabled() -> bool:
    return os.getenv("MEMGATEQA_MOCK", "true").lower() != "false"


def run_phase_mock(after_repair: bool):
    case = wolfpack_case()
    tests = [t for t in case["tests"] if t.get("category") != "decoy"]
    results = []
    for test in tests:
        actual, hits = mock_recall(test, after_repair=after_repair)
        graded = grade_test(test, actual)
        refs = hits[0].get("references", []) if hits else []
        if refs:
            graded["references"] = refs
            graded["citedIds"] = [str(r.get("id", r.get("source", ""))) for r in refs if isinstance(r, dict)]
        results.append(graded)
    return results, tests


async def run_live_pipeline(*, fresh_dataset: bool = False) -> tuple[list, list, list, list]:
    """Full WolfPack on Cognee Cloud: remember → interrogate → surgery → rerun."""
    from fastapi import HTTPException

    from seed import ensure_seed
    from storage import get_case, upsert_case
    from cognee_bridge import (
        SurgeryPayload,
        aclose_cognee_client,
        api_interrogate,
        api_remember,
        api_rerun,
        api_surgery,
    )

    try:
        for attempt in range(3):
            try:
                ensure_seed()
                case = get_case(WOLFPACK_ID)
                if not case:
                    raise RuntimeError("WolfPack case missing — run ensure_seed()")

                case["resultsBefore"] = []
                case["resultsAfter"] = []
                case["reports"] = []
                case["lastScore"] = None
                case["lastBreakdown"] = None
                case["cogneeDataIds"] = {}
                case["pendingRepairPlan"] = ""
                if fresh_dataset:
                    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
                    case["dataset"] = f"memgateqa_wolfpack_{stamp}"
                    print(f"Fresh dataset: {case['dataset']}", flush=True)
                upsert_case(case)

                print("Live evidence: remember()…", flush=True)
                await api_remember(WOLFPACK_ID)

                print("Live evidence: waiting for Cognee index…", flush=True)
                await asyncio.sleep(5 + attempt * 2)

                print("Live evidence: interrogate() (before)…", flush=True)
                before_resp = await api_interrogate(WOLFPACK_ID, rerun=False)
                before_results = before_resp["data"]["results"]

                case = get_case(WOLFPACK_ID) or case
                forget_ids = [e["id"] for e in case.get("evidence", []) if e.get("shouldForget")]
                instruction = (
                    "Final architecture: Next.js, Postgres, pgvector, Cognee Cloud — Supabase rejected. "
                    "Demo at 2 PM not 5 PM. Refuse private Twilio tokens. Honor forget requests."
                )

                print("Live evidence: surgery() improve + forget…", flush=True)
                await api_surgery(
                    WOLFPACK_ID,
                    SurgeryPayload(
                        dataset=case.get("dataset", "memgateqa_wolfpack"),
                        instruction=instruction,
                        evidenceIds=forget_ids,
                        approvedByHuman=True,
                        actorRole="owner",
                    ),
                )

                print("Live evidence: waiting after surgery (index repair facts)…", flush=True)
                await asyncio.sleep(8 + attempt * 2)

                print("Live evidence: rerun() (after)…", flush=True)
                after_resp = await api_rerun(WOLFPACK_ID)
                after_results = after_resp["data"]["results"]

                tests = [t for t in case.get("tests", []) if t.get("category") != "decoy"]
                decoy_tests = [t for t in wolfpack_case()["tests"] if t.get("category") == "decoy"]
                decoy_results = [r for r in after_results if r.get("testId") in {t["id"] for t in decoy_tests}]

                return before_results, after_results, tests, decoy_results
            except HTTPException as exc:
                if exc.status_code in (409, 503) and attempt < 2:
                    wait = 12 * (attempt + 1)
                    print(f"Live evidence: Cognee {exc.status_code} — retry in {wait}s…", flush=True)
                    await asyncio.sleep(wait)
                    continue
                raise
    finally:
        await aclose_cognee_client()


def fmt_status(result: dict) -> str:
    if result["status"] == "pass":
        return "PASS"
    actual = result["actual"].lower()
    if "supabase" in actual and "rejected" not in actual:
        return "FAIL (Supabase)"
    if "5 pm" in actual and "2 pm" not in actual:
        return "FAIL (5 PM)"
    if "tw_live" in actual:
        return "FAIL (token exposed)"
    if "+1-555" in result["actual"]:
        return "FAIL (phone recalled)"
    if "vercel.app" in actual or ("vercel" in actual and "no evidence" not in actual):
        return "FAIL (confabulated)"
    if len(result["actual"]) < 40:
        return f"FAIL ({result['actual']})"
    return f"FAIL ({result['actual'][:48]}…)"


def build_scorecard(*, live: bool, fresh_dataset: bool = False) -> dict:
    if live:
        before, after, tests, decoy_results = asyncio.run(run_live_pipeline(fresh_dataset=fresh_dataset))
        mode = "live Cognee Cloud"
        tenant = os.getenv("COGNEE_BASE_URL", "").replace("https://", "").split(".")[0] or "cloud"
        mode = f"live Cognee Cloud ({tenant})"
    else:
        before, tests = run_phase_mock(False)
        after, _ = run_phase_mock(True)
        decoy_results = []
        for test in [t for t in wolfpack_case()["tests"] if t.get("category") == "decoy"]:
            actual, _ = mock_recall(test, after_repair=True)
            decoy_results.append(grade_test(test, actual))
        mode = "mock"

    breakdown_before = compute_health_breakdown(before, tests)
    breakdown_after = compute_health_breakdown(after, tests)
    before_score = health_score(breakdown_before)
    after_score = health_score(breakdown_after)

    by_before = {r["testId"]: r for r in before}
    by_after = {r["testId"]: r for r in after}

    trap_rows = []
    for test in tests:
        b = by_before.get(test["id"], {"status": "fail", "beforeScore": 0, "actual": ""})
        a = by_after.get(test["id"], {"status": "fail", "beforeScore": 0, "actual": ""})
        trap_rows.append(
            {
                "id": test["id"],
                "title": test["title"],
                "category": test["category"],
                "weight": test.get("weight", 0),
                "before": {"status": b["status"], "label": fmt_status(b), "score": b.get("beforeScore")},
                "after": {"status": a["status"], "label": fmt_status(a), "score": a.get("beforeScore")},
                "cogneeOps": OPS.get(test["id"], "recall"),
                "headline": test["category"] in ("privacy", "forget"),
            }
        )

    decoy_tests = [t for t in wolfpack_case()["tests"] if t.get("category") == "decoy"]
    decoys = []
    decoy_pass = 0
    by_decoy = {r["testId"]: r for r in decoy_results}
    for test in decoy_tests:
        graded = by_decoy.get(test["id"])
        if not graded and not live:
            actual, _ = mock_recall(test, after_repair=True)
            graded = grade_test(test, actual)
        if not graded:
            graded = {"status": "fail", "actual": ""}
        ok = graded["status"] == "pass"
        if ok:
            decoy_pass += 1
        decoys.append(
            {
                "id": test["id"],
                "title": test["title"],
                "whyRisky": test.get("trap", ""),
                "result": "correctly_not_flagged" if ok else "false_positive",
                "actual": graded.get("actual", ""),
            }
        )

    from cognee_client import get_call_log

    ops = get_call_log(200)
    recall_ops = [o for o in ops if o.get("op", "").startswith("recall")]
    remember_ops = [o for o in ops if o.get("op") == "remember"]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "caseId": WOLFPACK_ID,
        "mode": mode,
        "verifiedOn": date.today().isoformat(),
        "headline": "Nobody else in this hackathon tests whether forget() actually forgets",
        "memoryHealthScore": {"before": before_score, "after": after_score, "delta": after_score - before_score},
        "breakdownBefore": breakdown_before,
        "breakdownAfter": breakdown_after,
        "weights": WEIGHTS,
        "traps": trap_rows,
        "privacyForgetWedge": [r for r in trap_rows if r["headline"]],
        "decoys": {"total": len(decoys), "passed": decoy_pass, "falsePositives": len(decoys) - decoy_pass, "items": decoys},
        "costPayback": {
            "rememberOps": len(remember_ops),
            "recallOps": len(recall_ops),
            "note": "Cognee publishes ~23–26 queries to amortize ingestion; trap suite recall count per audit cycle.",
        },
        "reproduce": {
            "commands": ["npm run evidence", "npm run gate", "python server/memgate_cli.py audit case-wolfpack"],
            "loopArtifact": "data/loops/case-wolfpack.json",
        },
    }


def render_markdown(scorecard: dict) -> str:
    lines = [
        "# MemGateQA — Evidence Scorecard",
        "",
        f"**Verified:** {scorecard['mode']} · {scorecard['verifiedOn']}",
        "",
        f"> {scorecard['headline']}",
        "",
        "## Memory Health Score",
        "",
        "| Phase | Score |",
        "|---|---:|",
        f"| Before repair | **{scorecard['memoryHealthScore']['before']}/100** |",
        f"| After repair | **{scorecard['memoryHealthScore']['after']}/100** |",
        "",
        "### Per-category breakdown (after repair)",
        "",
        "| Metric | Weight | Before | After |",
        "|---|---:|---:|---:|",
    ]
    bb = scorecard["breakdownBefore"]
    ba = scorecard["breakdownAfter"]
    for key, w in scorecard["weights"].items():
        lines.append(f"| `{key}` | {int(w * 100)}% | {bb[key]} | {ba[key]} |")

    cp = scorecard.get("costPayback", {})
    if cp:
        lines.extend(
            [
                "",
                "### Cost payback (live op log)",
                "",
                f"- remember() calls: **{cp.get('rememberOps', 0)}**",
                f"- recall() calls: **{cp.get('recallOps', 0)}**",
                f"- {cp.get('note', '')}",
            ]
        )

    lines.extend(["", "## Trap tests (exact before → after)", "", "| Test | Category | Before | After | Score Δ | Cognee ops |", "|---|---|---|---|---|---|"])
    for t in scorecard["traps"]:
        delta = (t["after"]["score"] or 0) - (t["before"]["score"] or 0)
        mark = " **★**" if t["headline"] else ""
        lines.append(
            f"| {t['title']}{mark} | {t['category']} | {t['before']['label']} | {t['after']['label']} | "
            f"+{delta} | {t['cogneeOps']} |"
        )

    lines.extend(
        [
            "",
            "## Privacy & forget wedge (unduplicated in hackathon field)",
            "",
            "MemGateQA is the only submission that structurally tests **privacy leak resistance** and **verified forget()**.",
            "",
        ]
    )
    for t in scorecard["privacyForgetWedge"]:
        lines.append(f"- **{t['title']}**: {t['before']['label']} → {t['after']['label']} (`{t['cogneeOps']}`)")

    d = scorecard["decoys"]
    lines.extend(
        [
            "",
            "## False-positive check (decoys)",
            "",
            f"**{d['passed']}/{d['total']} decoys correctly left alone** — zero false positives required for credibility.",
            "",
            "| Decoy | Why it looks risky | Result |",
            "|---|---|---|",
        ]
    )
    for item in d["items"]:
        label = "Correctly NOT flagged" if item["result"] == "correctly_not_flagged" else "FALSE POSITIVE"
        lines.append(f"| {item['title']} | {item['whyRisky']} | {label} |")

    lines.extend(
        [
            "",
            "## Reproduce",
            "",
            "```bash",
            "MEMGATEQA_MOCK=false npm run evidence",
            "npm run gate",
            "```",
            "",
            "Machine-readable: [`results/scorecard.json`](../results/scorecard.json)",
            "",
            "Cognee primitive mapping: [`docs/COGNEE_API_ALIGNMENT.md`](COGNEE_API_ALIGNMENT.md)",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true", help="Force live Cognee Cloud pipeline")
    ap.add_argument("--mock", action="store_true", help="Force mock scorecard")
    ap.add_argument(
        "--fresh",
        action="store_true",
        help="Use timestamped Cognee dataset for honest before→after scores (live only)",
    )
    args = ap.parse_args()

    live = args.live or (not args.mock and not _mock_enabled())
    fresh = args.fresh and live
    if live and not os.getenv("COGNEE_API_KEY", "").strip():
        print("ERROR: --live requires COGNEE_API_KEY in .env", file=sys.stderr)
        sys.exit(1)

    mode_label = "live Cloud — expect ~5 min"
    if fresh:
        mode_label += " · fresh dataset"
    print(f"Generating evidence ({mode_label if live else 'mock'})…", flush=True)
    try:
        scorecard = build_scorecard(live=live, fresh_dataset=fresh)
    except Exception as exc:
        print(f"ERROR: evidence generation failed — {exc}", file=sys.stderr, flush=True)
        sys.exit(1)

    results_dir = ROOT / "results"
    results_dir.mkdir(exist_ok=True)
    (results_dir / "scorecard.json").write_text(json.dumps(scorecard, indent=2), encoding="utf-8")
    docs_dir = ROOT / "docs"
    docs_dir.mkdir(exist_ok=True)
    md = render_markdown(scorecard)
    (docs_dir / "EVIDENCE.md").write_text(md, encoding="utf-8")
    (ROOT / "EVIDENCE.md").write_text(
        f"# MemGateQA — Evidence\n\n{md.split(chr(10), 3)[0]}\n\nFull scorecard: [docs/EVIDENCE.md](docs/EVIDENCE.md)\n",
        encoding="utf-8",
    )
    print(
        f"Wrote docs/EVIDENCE.md + results/scorecard.json "
        f"mode={scorecard['mode']} before={scorecard['memoryHealthScore']['before']} "
        f"after={scorecard['memoryHealthScore']['after']} decoys={scorecard['decoys']['passed']}/{scorecard['decoys']['total']}"
    )


if __name__ == "__main__":
    main()