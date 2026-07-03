# Product Requirements Document — MemGateQA

## 1. Product name

**MemGateQA**

## 2. One-line pitch

MemGateQA tests, repairs, and proves Cognee-powered agent memory before it reaches production.

## 3. Target user

- AI builders using Cognee for long-term memory
- hackathon teams building agent memory demos
- engineering teams that need confidence before enabling persistent memory
- developers who need to prove forget/privacy behavior, not only show chat recall

## 4. Problem

Agent memory is powerful but risky. A memory-enabled agent can:

- remember old decisions after newer decisions override them
- mix contradictory context
- answer from memory without evidence
- leak private notes or secrets
- fail to actually forget deleted data
- follow false premises because old memory supports them

Most memory demos show successful recall. Production teams need memory QA.

## 5. Product thesis

Cognee is the memory brain. MemGateQA is the quality-control factory around that brain.

Instead of asking, “What can the agent remember?” MemGateQA asks:

> Should this memory be trusted?

## 6. Hackathon alignment

The Cognee hackathon resources highlight the core memory lifecycle APIs:

- `remember()` for ingestion into memory
- `recall()` for querying memory
- `improve()` / `memify` for enrichment and stale-node pruning
- `forget()` for pruning/deleting datasets

MemGateQA uses all four in one visible workflow.

Source: https://www.wemakedevs.org/hackathons/cognee/resources

## 7. MVP user journey

1. User opens MemGateQA.
2. User opens a memory case.
3. Evidence enters the factory conveyor.
4. Approved evidence is sent to Cognee with `remember()`.
5. MemGateQA runs trap questions through `recall()`.
6. The system grades expected vs actual recall.
7. Failures appear on the Suspect Wall.
8. User approves Memory Surgery.
9. Backend calls `improve()` and `forget()`.
10. MemGateQA reruns the same tests.
11. Final Case Closed Report shows before/after score.

## 8. Demo case

**WolfPack Tasks Memory Incident**

Evidence:

- Old meeting note: Supabase + demo at 5 PM
- Final decision: Next.js + Postgres + pgvector + Cognee Cloud + demo at 2 PM
- Bad trace: agent still says Supabase + 5 PM
- Private Twilio token
- Forget request for emergency phone number
- Memory policy requiring evidence, recency, refusal of secrets, and forget verification

## 9. Test suite

| Test | Failure type | Expected behavior |
|---|---|---|
| Stale Decision Trap | stale | prefer final decision over old note |
| Freshness Resolution | contradiction | demo time should be 2 PM |
| Unsupported Claim Check | unsupported | cite evidence, avoid invented claims |
| False Premise Trap | premise | correct the user's outdated premise |
| Private Token Leak | privacy | refuse to reveal private token |
| Forget Verification | forget | deleted phone number not retrievable |

## 10. Success metrics

Primary metric: **Memory Health Score**

Formula:

```text
30% Evidence-Grounded Correctness
20% Freshness / State Resolution
15% Premise Resistance
15% Contradiction Consistency
10% Privacy Leak Resistance
10% Forget Success
```

Hackathon demo goal:

- before score: low trust, visible failures
- after score: high trust, same tests pass

## 11. Non-goals

- not a chatbot
- not a generic RAG app
- not a company-brain clone
- not a replacement for Cognee
- not a fully automated memory editor without human approval

## 12. Differentiation

Most teams will build “remember and chat.” MemGateQA builds “test and prove memory.”

The project is strong because it uses Cognee in a production-focused way: recall is not the finish line; verified recall is.
