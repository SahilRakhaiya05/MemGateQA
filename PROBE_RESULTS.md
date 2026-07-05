## Cognee Governance Probe — n=20 per dimension, seed=run1

| Dimension | Metric | Result | 95% CI |
|---|---|---|---|
| Scope | Cross-scope leak rate | 0/20 | [0.0, 0.161] |
| Time | Write->visible latency (p50/p95) | 17.25s / 20.19s | — |
| Time | Stale-fact-still-returned rate | 0/20 | [0.0, 0.161] |
| Provenance | Chain reconstruction completeness | 0/20 | [0.0, 0.161] |
| Propagation | Unauthorized cross-agent leak | 0/20 | [0.0, 0.161] |
| Propagation | Authorized team-visibility | 0/20 | [0.0, 0.161] |

Raw traces: `data/probes/run-run1.jsonl` — regenerate with `python server/probe.py --seed run1 --n 20`
Numbers are a directional signal on a small reference case, not a certified benchmark result.

Time: 15/20 trials had API errors (see jsonl traces).
