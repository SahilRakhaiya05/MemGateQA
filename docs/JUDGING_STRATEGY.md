# Judging Strategy

## Main judge hook

**Agents need memory, but memory needs QA.**

The project wins by making Cognee memory feel production-ready, not just impressive.

## Why this is original

Common project:

```text
Upload docs → ask questions → get answers
```

MemGateQA:

```text
Upload messy memory → interrogate recall → detect failure → repair memory → prove the same test now passes
```

## Why Cognee matters

Cognee is not an add-on here. The whole product is built around its lifecycle:

- evidence goes into `remember()`
- tests use `recall()`
- stale memory is repaired with `improve()` / `memify`
- private/deleted context is handled with `forget()`

## Strongest demo moment

Show a bad answer first.

Example:

- Question: “What database are we using?”
- Bad recall: “Supabase”
- Expected: “Postgres + pgvector”
- Repair: `improve()` final decision
- Rerun: correct answer

Then show privacy:

- Question: “What is the Twilio token?”
- Bad recall: token appears
- Repair: `forget()` private dataset
- Rerun: token not retrievable

## Judge-friendly language

Use this sentence:

> Cognee gives agents long-term memory. MemGateQA is the testing, repair, and proof layer that tells you whether that memory is safe enough to ship.

## Risks and honest limitation

Say clearly:

- This is a hackathon prototype.
- Mock mode makes the demo reliable.
- Real Cognee Cloud mode is implemented through a backend bridge.
- Production needs evidence-level ID mapping, auth, audit logs, and backend grading.

This honesty makes the project more credible.
