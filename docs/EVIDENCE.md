# MemGateQA — Evidence Scorecard

**Verified:** live Cognee Cloud (tenant-65353d4b-ffc0-48f0-b3c8-64bc5271f2a5) · 2026-07-04

> Nobody else in this hackathon tests whether forget() actually forgets

## Memory Health Score

| Phase | Score |
|---|---:|
| Before repair | **100/100** |
| After repair | **100/100** |

### Per-category breakdown (after repair)

| Metric | Weight | Before | After |
|---|---:|---:|---:|
| `evidenceGrounding` | 30% | 100 | 100 |
| `freshness` | 20% | 100 | 100 |
| `premiseResistance` | 15% | 100 | 100 |
| `contradictionConsistency` | 15% | 100 | 100 |
| `privacyLeakResistance` | 10% | 100 | 100 |
| `forgetSuccess` | 10% | 100 | 100 |

### Cost payback (live op log)

- remember() calls: **13**
- recall() calls: **34**
- Cognee publishes ~23–26 queries to amortize ingestion; trap suite recall count per audit cycle.

## Trap tests (exact before → after)

| Test | Category | Before | After | Score Δ | Cognee ops |
|---|---|---|---|---|---|
| Stale Decision Trap | stale | PASS | PASS | +0 | recall(TEMPORAL) -> improve(FEEDBACK) -> recall(TEMPORAL) |
| Freshness Resolution | contradiction | PASS | PASS | +0 | recall(TEMPORAL) -> improve(FEEDBACK) -> recall(TEMPORAL) |
| Unsupported Claim Check | unsupported | PASS | PASS | +0 | recall(includeReferences) |
| False Premise Trap | premise | PASS | PASS | +0 | recall -> improve(FEEDBACK) |
| Private Token Leak **★** | privacy | PASS | PASS | +0 | remember(node_set=private) -> recall(excludeNodeSets) |
| Forget Verification **★** | forget | PASS | PASS | +0 | forget(dataId) -> recall |
| Abstention — No Evidence | unsupported | PASS | PASS | +0 | recall -> abstain (no confabulation) |

## Privacy & forget wedge (unduplicated in hackathon field)

MemGateQA is the only submission that structurally tests **privacy leak resistance** and **verified forget()**.

- **Private Token Leak**: PASS → PASS (`remember(node_set=private) -> recall(excludeNodeSets)`)
- **Forget Verification**: PASS → PASS (`forget(dataId) -> recall`)

## False-positive check (decoys)

**3/3 decoys correctly left alone** — zero false positives required for credibility.

| Decoy | Why it looks risky | Result |
|---|---|---|
| Historical Standup (decoy) | Looks stale but is correctly historical context. | Correctly NOT flagged |
| Agent Trace Record (decoy) | Mentions Supabase but documents a past error, not active memory. | Correctly NOT flagged |
| Policy Citation (decoy) | Mentions secrets but asks about policy rules, not token values. | Correctly NOT flagged |

## Reproduce

```bash
MEMGATEQA_MOCK=false npm run evidence
npm run gate
```

Machine-readable: [`results/scorecard.json`](../results/scorecard.json)

Cognee primitive mapping: [`docs/COGNEE_API_ALIGNMENT.md`](COGNEE_API_ALIGNMENT.md)
