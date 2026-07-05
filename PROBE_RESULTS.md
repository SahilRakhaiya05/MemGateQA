## Cognee Governance Probe — n=3 per dimension, seed=run1-fix

| Dimension | Metric | Result | 95% CI |
|---|---|---|---|
| Scope | Cross-scope leak rate | 1/3 | [0.061, 0.792] |
| Time | Write->visible latency (p50/p95) | 26.09s / 42.56s | — |
| Time | Stale-fact-still-returned rate | 3/3 | [0.438, 1.0] |
| Provenance | Chain reconstruction completeness | 0/3 | [0.0, 0.562] |
| Propagation | Unauthorized cross-agent leak | 0/3 | [0.0, 0.562] |
| Propagation | Authorized team-visibility | 0/3 | [0.0, 0.562] |

Raw traces: `data/probes/run-run1-fix.jsonl` — regenerate with `python server/probe.py --seed run1-fix --n 3`
Numbers are a directional signal on a small reference case, not a certified benchmark result.

### Time-dimension API errors — fixed (2026-07-05)

**Before fix** (`run-run1.jsonl`, n=20): Time dimension logged **15/20 trials with API errors** — `409: An error occurred during recall` on immediate post-`remember()` recall.

**Root cause:** `recall()` raced Cognee index settlement; TEMPORAL and GRAPH_COMPLETION both returned 409.

**Fix in `server/probe.py`:** 3s settle after `remember()`, plus retry on 409/503/429 (2s / 4s / 8s backoff).

**After fix** (`run-run1-fix.jsonl`, n=3): Time dimension **0/3 API errors** — all trials completed recall without 409.

Prior full run (pre-fix): `data/probes/run-run1.jsonl` · Full re-run: `python server/probe.py --seed run1 --n 20`
