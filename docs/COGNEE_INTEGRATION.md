# Cognee Integration Plan

## Why Cognee

Cognee is the memory layer. It provides persistent long-term memory for agents, combining ingestion, knowledge graph memory, vector embeddings, graph reasoning, and ontology generation.

Source: https://github.com/topoteretes/cognee

## Lifecycle mapping

| Cognee API | MemGateQA screen | Purpose |
|---|---|---|
| `remember()` | Evidence Factory | store approved evidence into memory |
| `recall()` | Interrogation Room | ask trap questions against memory |
| `improve()` / `memify` | Memory Surgery | enrich/prune stale memory and apply correction feedback |
| `forget()` | Forget Verification | remove private/deleted datasets and prove they are not recallable |

The hackathon resource page explicitly describes these four lifecycle operations.

Source: https://www.wemakedevs.org/hackathons/cognee/resources

## Environment variables

Frontend:

```bash
VITE_MEMGATEQA_MOCK=false
VITE_COGNEE_PROXY_URL=http://localhost:8788
```

Backend:

```bash
MEMGATEQA_MOCK=false
COGNEE_BASE_URL=https://your-instance.cognee.ai
COGNEE_API_KEY=ck_your_key_here
LLM_API_KEY=sk_your_llm_key_here
```

## Bridge endpoints

```text
GET  /health
POST /api/cases
POST /api/cases/{case_id}/evidence
POST /api/cases/{case_id}/remember
POST /api/cases/{case_id}/interrogate
POST /api/cases/{case_id}/surgery
POST /api/cases/{case_id}/report
GET  /api/cases/{case_id}/report
```

## Example backend flow

```python
import cognee

await cognee.serve(url=COGNEE_BASE_URL, api_key=COGNEE_API_KEY)
await cognee.remember(evidence_text)
results = await cognee.recall(test_question)
await cognee.improve("Final decision overrides stale Supabase plan")
await cognee.forget(dataset="memgateqa_wolfpack_private")
```

## Dataset strategy

Use separate datasets for safer deletion:

```text
memgateqa_wolfpack_demo_public
memgateqa_wolfpack_demo_internal
memgateqa_wolfpack_demo_private
memgateqa_wolfpack_demo_forget_test
```

In the hackathon prototype, the bridge keeps dataset metadata inside the text payload for portability. In production, map every evidence item to an exact Cognee dataset/document ID.

## Real-mode caveat

Different Cognee deployments may expose dataset/document-level deletion differently. The included bridge uses a conservative dataset-level `forget()` pattern for demo safety. Production should delete exact private datasets/documents, then rerun negative recall tests.
