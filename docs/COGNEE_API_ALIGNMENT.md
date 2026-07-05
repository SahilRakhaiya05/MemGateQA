# Cognee API Alignment — MemGateQA Grading Pipeline

Every MemGateQA health metric maps 1:1 to a Cognee Cloud primitive. Scoring is not a custom UI layer — it is a deterministic grade over real API responses.

## Health score → Cognee primitive

| MemGateQA metric | Weight | WolfPack trap | Cognee API | MemGateQA call site |
|---|---:|---|---|---|
| `evidenceGrounding` | 30% | Unsupported Claim Check | `POST /api/v1/recall` with `includeReferences: true` | `cognee_client.recall()` → `grade_test(category=unsupported)` |
| `freshness` | 20% | Stale Decision Trap, Freshness Resolution | `POST /api/v1/recall` with `searchType: "TEMPORAL"` | `_search_type_for_test()` → `recall.temporal` |
| `premiseResistance` | 15% | False Premise Trap | `POST /api/v1/recall` + `improve()` feedback | `recall()` → `improve(FEEDBACK)` via `/api/v1/remember/entry` |
| `contradictionConsistency` | 15% | Freshness Resolution | `searchType: "TEMPORAL"` on time-conflicting evidence | same as freshness |
| `privacyLeakResistance` | 10% | Private Token Leak | `remember(node_set=["private"])` + `recall(excludeNodeSets=["private"])` | `remember_fact(sensitivity=private)` |
| `forgetSuccess` | 10% | Forget Verification | `POST /api/v1/forget` + negative `recall()` | `forget(dataId)` → re-interrogate |

## Lifecycle ops → distinct Cognee endpoints

| UI label | Cognee endpoint | Semantics |
|---|---|---|
| `remember()` | `POST /api/v1/remember` | Index evidence with per-fact + `private` NodeSets |
| `recall()` | `POST /api/v1/recall` | Trap interrogation; `GRAPH_COMPLETION` default |
| `recall(TEMPORAL)` | `POST /api/v1/recall` + `searchType: TEMPORAL` | Time-aware retrieval for stale/freshness traps |
| `recall(FEEDBACK)` | `POST /api/v1/recall` + `searchType: FEEDBACK` | Context for feedback-driven repair |
| `improve()` | `POST /api/v1/improve` → fallback `POST /api/v1/remember/entry` `type: feedback` | Reweights graph edges; nothing deleted |
| `memify()` | `POST /api/v1/cognify` + custom prompt | Graph enrichment — separate from improve |
| `forget()` | `POST /api/v1/forget` or `DELETE /datasets/{id}/data/{dataId}` | Verified deletion + negative recall |

## Proof & governance primitives

| MemGateQA feature | Cognee API | Purpose |
|---|---|---|
| Memory graph panel | `GET /api/v1/datasets/{id}/graph` | Live node/edge visualization |
| Schema inventory strip | `GET /api/v1/schema/inventory` | Entity-type counts per dataset |
| Chain of custody | `GET /api/v1/schema/provenance` | Tenant → agent → dataset lineage |
| OTEL trace IDs | `GET /api/v1/activity/spans` | Verifiable op trace on Proof Certificate |
| Proof bundle export | `GET /api/v1/activity/export/{dataset_id}` | Self-contained evidence zip |
| RBAC surgery gate | `POST /api/v1/permissions/roles` + dataset permissions | Reviewer cannot `forget()` |

## What is *not* custom

- Trap pass/fail: deterministic Python in `server/grading.py` over recall text + citation metadata
- Health score formula: `src/memgateqa/scoring.ts` weights applied in `server/grading.py`
- Decoy false-positive check: `category: decoy` tests excluded from health denominator
- Human surgery gate: `approvedByHuman: true` required on `POST /api/cases/{id}/surgery`

## Reproduce alignment

```bash
python scripts/generate_evidence.py   # writes docs/EVIDENCE.md + results/scorecard.json
npm run audit                         # full WolfPack loop against bridge
```