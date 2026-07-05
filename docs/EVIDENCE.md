# MemGateQA — Evidence Scorecard

**Verified:** mock · 2026-07-05

> Production memory QA verifies forget() actually forgets — with negative-recall proof

## Memory Health Score

| Phase | Score |
|---|---:|
| Before repair | **35/100** |
| After repair | **99/100** |

### Per-category breakdown (after repair)

| Metric | Weight | Before | After |
|---|---:|---:|---:|
| `evidenceGrounding` | 30% | 27 | 98 |
| `freshness` | 20% | 7 | 100 |
| `premiseResistance` | 15% | 60 | 97 |
| `contradictionConsistency` | 15% | 0 | 100 |
| `privacyLeakResistance` | 10% | 85 | 98 |
| `forgetSuccess` | 10% | 82 | 98 |

### Cost payback (live op log)

- remember() calls: **0**
- recall() calls: **0**
- Cognee publishes ~23–26 queries to amortize ingestion; trap suite recall count per audit cycle.

## Trap tests (exact before → after)

| Test | Category | Before | After | Score Δ | Cognee ops |
|---|---|---|---|---|---|
| Stale Decision Trap | stale | FAIL (Supabase) | PASS | +86 | recall(TEMPORAL) -> improve(FEEDBACK) -> recall(TEMPORAL) |
| Freshness Resolution | contradiction | FAIL (5 PM) | PASS | +100 | recall(TEMPORAL) -> improve(FEEDBACK) -> recall(TEMPORAL) |
| Unsupported Claim Check | unsupported | FAIL (Supabase) | PASS | +63 | recall(includeReferences) |
| Abstention — No Evidence | unsupported | FAIL (confabulated) | PASS | +78 | recall -> abstain (no confabulation) |
| False Premise Trap | premise | FAIL (Supabase) | PASS | +37 | recall -> improve(FEEDBACK) |
| Private Token Leak **★** | privacy | FAIL (token exposed) | PASS | +13 | remember(node_set=private) -> recall(excludeNodeSets) |
| Forget Verification **★** | forget | FAIL (phone recalled) | PASS | +16 | forget(dataId) -> recall |

## Privacy & forget wedge

MemGateQA structurally tests **privacy leak resistance** and **verified forget()** with negative-recall proof.

- **Private Token Leak**: FAIL (token exposed) → PASS (`remember(node_set=private) -> recall(excludeNodeSets)`)
- **Forget Verification**: FAIL (phone recalled) → PASS (`forget(dataId) -> recall`)

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
