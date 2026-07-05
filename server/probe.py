"""Cognee Governance Probe — reproducible, seeded measurement harness.

One experiment per governance dimension: Scope, Time, Provenance, Propagation.
Usage: python server/probe.py --seed <nonce> --n 40 --dataset probe_<nonce>
Writes raw trials to data/probes/run-<nonce>.jsonl and prints a markdown table.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import math
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

TRACE_DIR = ROOT / "data" / "probes"
TRACE_DIR.mkdir(parents=True, exist_ok=True)


def wilson_ci(successes: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score interval — no scipy dependency."""
    if n == 0:
        return (0.0, 0.0)
    p = successes / n
    denom = 1 + z**2 / n
    center = (p + z**2 / (2 * n)) / denom
    margin = (z * math.sqrt((p * (1 - p) + z**2 / (4 * n)) / n)) / denom
    return (max(0.0, center - margin), min(1.0, center + margin))


def _err(exc: BaseException) -> str:
    return str(exc)[:300]


async def safe_recall(
    client,
    query: str,
    dataset: str,
    *,
    search_type: str = "GRAPH_COMPLETION",
    exclude_node_sets: Optional[List[str]] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    try:
        hits = await client.recall(
            query,
            dataset,
            search_type=search_type,
            include_references=True,
            exclude_node_sets=exclude_node_sets,
        )
        return hits, None
    except Exception as exc:
        return [], _err(exc)


async def safe_remember(
    client,
    fact_id: str,
    text: str,
    dataset: str,
    *,
    sensitivity: Optional[str] = None,
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    try:
        return await client.remember_fact(fact_id, text, dataset, sensitivity=sensitivity), None
    except Exception as exc:
        return None, _err(exc)


async def warmup_dataset(client, dataset: str, nonce: str) -> Optional[str]:
    """Index one fact + memify so recall() has graph material on fresh probe datasets."""
    _, err = await safe_remember(client, f"probe-warm-{nonce}", "Governance probe warmup document.", dataset)
    if err:
        return err
    try:
        await client.memify(dataset)
    except Exception as exc:
        return _err(exc)
    return None


async def scope_probe(client, dataset: str, nonce: str, n: int) -> dict:
    """Does a restricted fact ever leak to a differently-scoped recall?"""
    leaks = 0
    errors = 0
    trials = []
    for i in range(n):
        fact_id = f"scope-{nonce}-{i}"
        secret = f"SECRET-VALUE-{uuid.uuid4().hex[:8]}"
        _, rem_err = await safe_remember(
            client, fact_id, f"Restricted note: {secret}", dataset, sensitivity="private"
        )
        hits, rec_err = await safe_recall(
            client,
            "List everything you know that might be sensitive.",
            dataset,
            search_type="GRAPH_COMPLETION",
            exclude_node_sets=["private"],
        )
        if rem_err or rec_err:
            errors += 1
        leaked = not rec_err and any(secret in str(h) for h in hits)
        leaks += int(leaked)
        trials.append({"trial": i, "fact_id": fact_id, "leaked": leaked, "remember_error": rem_err, "recall_error": rec_err})
    lo, hi = wilson_ci(leaks, n)
    return {
        "dimension": "Scope",
        "metric": "cross-scope leak rate",
        "successes": leaks,
        "n": n,
        "errors": errors,
        "ci95": [round(lo, 3), round(hi, 3)],
        "trials": trials,
    }


async def time_probe(client, dataset: str, nonce: str, n: int) -> dict:
    """Write -> visible latency, and whether a superseded fact still gets returned."""
    latencies: list[float] = []
    stale_returns = 0
    errors = 0
    trials = []
    for i in range(n):
        fact_id = f"time-{nonce}-{i}"
        t0 = time.monotonic()
        _, rem_err = await safe_remember(client, fact_id, "The demo is at 5 PM.", dataset)
        hits, rec_err = await safe_recall(client, "What time is the demo?", dataset, search_type="TEMPORAL")
        recall_mode = "TEMPORAL"
        if rec_err:
            hits, fb_err = await safe_recall(client, "What time is the demo?", dataset, search_type="GRAPH_COMPLETION")
            rec_err = fb_err or rec_err
            recall_mode = "GRAPH_COMPLETION (TEMPORAL failed)"
        latencies.append(time.monotonic() - t0)

        _, rem2_err = await safe_remember(client, f"{fact_id}-v2", "Correction: the demo is at 2 PM.", dataset)
        hits2, rec2_err = await safe_recall(client, "What time is the demo?", dataset, search_type="TEMPORAL")
        if rec2_err:
            hits2, fb2_err = await safe_recall(client, "What time is the demo?", dataset, search_type="GRAPH_COMPLETION")
            rec2_err = fb2_err or rec2_err
        if rem_err or rec_err or rem2_err or rec2_err:
            errors += 1
        still_stale = not rec2_err and any("5 PM" in str(h) or "5pm" in str(h).lower() for h in hits2)
        stale_returns += int(still_stale)
        trials.append({
            "trial": i,
            "fact_id": fact_id,
            "still_stale": still_stale,
            "recall_mode": recall_mode,
            "remember_error": rem_err,
            "recall_error": rec_err,
            "recall2_error": rec2_err,
        })
    latencies.sort()
    p50 = latencies[len(latencies) // 2] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    lo, hi = wilson_ci(stale_returns, n)
    return {
        "dimension": "Time",
        "write_visible_p50_s": round(p50, 2),
        "write_visible_p95_s": round(p95, 2),
        "stale_return_rate": {"successes": stale_returns, "n": n, "ci95": [round(lo, 3), round(hi, 3)]},
        "errors": errors,
        "trials": trials,
    }


async def provenance_probe(client, dataset: str, nonce: str, n: int) -> dict:
    """Walk a 3-hop causal chain; check every hop is reachable."""
    complete = 0
    errors = 0
    trials = []
    for i in range(n):
        chain_id = f"prov-{nonce}-{i}"
        steps = [
            (f"{chain_id}-obs", "Observation: response latency spiked at 14:02."),
            (f"{chain_id}-hyp", "Hypothesis: a connection pool exhausted, derived from the 14:02 spike."),
            (f"{chain_id}-fix", "Mitigation: pool size increased, derived from the exhaustion hypothesis."),
        ]
        step_err = None
        for fid, text in steps:
            _, err = await safe_remember(client, fid, text, dataset)
            if err:
                step_err = err
        mem_err = None
        try:
            await client.memify(dataset)
        except Exception as exc:
            mem_err = _err(exc)
        graph_err = None
        graph: Dict[str, Any] = {}
        try:
            graph = await client.get_graph(dataset)
        except Exception as exc:
            graph_err = _err(exc)
        ids_present = {n_["id"] for n_ in graph.get("nodes", [])}
        hops_reachable = sum(1 for fid, _ in steps if any(fid in str(x) for x in ids_present))
        is_complete = hops_reachable == len(steps)
        complete += int(is_complete)
        if step_err or mem_err or graph_err:
            errors += 1
        trials.append({
            "trial": i,
            "chain_id": chain_id,
            "hops_reachable": hops_reachable,
            "hops_total": len(steps),
            "remember_error": step_err,
            "memify_error": mem_err,
            "graph_error": graph_err,
        })
    lo, hi = wilson_ci(complete, n)
    return {
        "dimension": "Provenance",
        "metric": "chain reconstruction completeness",
        "successes": complete,
        "n": n,
        "errors": errors,
        "ci95": [round(lo, 3), round(hi, 3)],
        "trials": trials,
    }


async def propagation_probe(client, dataset: str, nonce: str, n: int) -> dict:
    """Agent-local facts must not leak; team-shared facts must reach recall."""
    unauthorized_leaks = 0
    authorized_hits = 0
    errors = 0
    trials = []
    for i in range(n):
        local_secret = f"LOCAL-{uuid.uuid4().hex[:6]}"
        team_fact = f"TEAM-{uuid.uuid4().hex[:6]}"
        _, rem1_err = await safe_remember(client, f"local-{nonce}-{i}", f"Agent-local only: {local_secret}", dataset)
        _, rem2_err = await safe_remember(client, f"team-{nonce}-{i}", f"Team-shared: {team_fact}", dataset)
        hits, rec_err = await safe_recall(client, "What do you know?", dataset, search_type="GRAPH_COMPLETION")
        if rem1_err or rem2_err or rec_err:
            errors += 1
        leaked = not rec_err and any(local_secret in str(h) for h in hits)
        reached = not rec_err and any(team_fact in str(h) for h in hits)
        unauthorized_leaks += int(leaked)
        authorized_hits += int(reached)
        trials.append({
            "trial": i,
            "unauthorized_leak": leaked,
            "authorized_visible": reached,
            "remember_error": rem1_err or rem2_err,
            "recall_error": rec_err,
        })
    lo_l, hi_l = wilson_ci(unauthorized_leaks, n)
    lo_a, hi_a = wilson_ci(authorized_hits, n)
    return {
        "dimension": "Propagation",
        "unauthorized_leak_rate": {
            "successes": unauthorized_leaks,
            "n": n,
            "ci95": [round(lo_l, 3), round(hi_l, 3)],
        },
        "authorized_visibility_rate": {
            "successes": authorized_hits,
            "n": n,
            "ci95": [round(lo_a, 3), round(hi_a, 3)],
        },
        "errors": errors,
        "trials": trials,
    }


def render_markdown(results: dict, nonce: str, n: int, warmup_error: Optional[str] = None) -> str:
    s, t, p, g = results["scope"], results["time"], results["provenance"], results["propagation"]
    notes = []
    if warmup_error:
        notes.append(f"Dataset warmup note: `{warmup_error}`")
    for dim, payload in results.items():
        if payload.get("errors"):
            notes.append(f"{payload.get('dimension', dim)}: {payload['errors']}/{n} trials had API errors (see jsonl traces).")
    note_block = ("\n\n" + "\n".join(notes)) if notes else ""
    return f"""## Cognee Governance Probe — n={n} per dimension, seed={nonce}

| Dimension | Metric | Result | 95% CI |
|---|---|---|---|
| Scope | Cross-scope leak rate | {s['successes']}/{s['n']} | {s['ci95']} |
| Time | Write->visible latency (p50/p95) | {t['write_visible_p50_s']}s / {t['write_visible_p95_s']}s | — |
| Time | Stale-fact-still-returned rate | {t['stale_return_rate']['successes']}/{t['stale_return_rate']['n']} | {t['stale_return_rate']['ci95']} |
| Provenance | Chain reconstruction completeness | {p['successes']}/{p['n']} | {p['ci95']} |
| Propagation | Unauthorized cross-agent leak | {g['unauthorized_leak_rate']['successes']}/{g['unauthorized_leak_rate']['n']} | {g['unauthorized_leak_rate']['ci95']} |
| Propagation | Authorized team-visibility | {g['authorized_visibility_rate']['successes']}/{g['authorized_visibility_rate']['n']} | {g['authorized_visibility_rate']['ci95']} |

Raw traces: `data/probes/run-{nonce}.jsonl` — regenerate with `python server/probe.py --seed {nonce} --n {n}`
Numbers are a directional signal on a small reference case, not a certified benchmark result.{note_block}
"""


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", default=uuid.uuid4().hex[:8])
    ap.add_argument("--n", type=int, default=20)
    ap.add_argument("--dataset", default=None)
    ap.add_argument("--mock", action="store_true", help="Write placeholder only — do not use for submission")
    args = ap.parse_args()
    dataset = args.dataset or f"probe_{args.seed}"

    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
    if args.mock:
        note = (
            f"## Cognee Governance Probe — MOCK MODE (not committed metrics)\n\n"
            f"Seed `{args.seed}`, n={args.n}. Re-run against Cloud tenant:\n"
            f"`python server/probe.py --seed {args.seed} --n {args.n}`\n"
        )
        (ROOT / "PROBE_RESULTS.md").write_text(note, encoding="utf-8")
        print(note)
        return

    if not os.environ.get("COGNEE_API_KEY", "").strip():
        note = (
            f"## Cognee Governance Probe — SKIPPED (no COGNEE_API_KEY)\n\n"
            f"Seed `{args.seed}`, n={args.n}. Run with real Cloud credentials:\n"
            f"`python server/probe.py --seed {args.seed} --n {args.n}`\n"
        )
        (ROOT / "PROBE_RESULTS.md").write_text(note, encoding="utf-8")
        print(note)
        return

    from cognee_client import CogneeHttpClient

    print(f"Starting governance probe seed={args.seed} n={args.n} dataset={dataset}…", flush=True)
    client = CogneeHttpClient(
        base_url=os.environ["COGNEE_BASE_URL"].rstrip("/"),
        api_key=os.environ["COGNEE_API_KEY"],
        session_id=f"probe-{args.seed}",
        default_dataset=dataset,
    )

    warmup_error = await warmup_dataset(client, dataset, args.seed)
    if warmup_error:
        print(f"Warmup warning: {warmup_error}", flush=True)

    results: Dict[str, dict] = {}
    for name, fn in (
        ("scope", scope_probe),
        ("time", time_probe),
        ("provenance", provenance_probe),
        ("propagation", propagation_probe),
    ):
        print(f"Running {name} probe…", flush=True)
        try:
            results[name] = await fn(client, dataset, args.seed, args.n)
        except Exception as exc:
            results[name] = {
                "dimension": name,
                "metric": "probe_failed",
                "successes": 0,
                "n": args.n,
                "errors": args.n,
                "ci95": [0.0, 0.0],
                "fatal_error": _err(exc),
                "trials": [],
            }
            print(f"{name} probe fatal: {exc}", flush=True)

    trace_path = TRACE_DIR / f"run-{args.seed}.jsonl"
    with open(trace_path, "w", encoding="utf-8") as f:
        f.write(json.dumps({"warmup_error": warmup_error, "seed": args.seed, "n": args.n, "dataset": dataset}) + "\n")
        for dim, payload in results.items():
            f.write(json.dumps({"dimension": dim, **payload}) + "\n")

    report = render_markdown(results, args.seed, args.n, warmup_error)
    print(report)
    (ROOT / "PROBE_RESULTS.md").write_text(report, encoding="utf-8")

    if hasattr(client, "_client") and client._client and not client._client.is_closed:
        await client._client.aclose()


if __name__ == "__main__":
    asyncio.run(main())