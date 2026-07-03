# MemGateQA

**QA, repair, and proof layer for Cognee-powered agent memory.**

MemGateQA is a hackathon-ready product prototype for **The Hangover Part AI: Where's My Context?**. It turns Cognee memory into a repeatable quality-control workflow: ingest evidence, interrogate recall, detect memory bugs, approve repair, rerun tests, and export proof.

## Why this is not just another memory app

Most demos show what an agent remembers. MemGateQA asks the harder production question:

> Can we trust what the agent remembers?

The app tests six failure modes:

1. Stale decision memory
2. Contradictory context
3. Unsupported / hallucinated recall
4. False-premise following
5. Private secret leakage
6. Failed forget requests

Cognee remains the memory layer. MemGateQA is the **QA factory** around Cognee memory.

## Cognee fit

The hackathon resources describe Cognee's memory lifecycle APIs as:

- `remember()` — ingest text, files, and URLs into the knowledge graph
- `recall()` — query memory using semantic and graph traversal routes
- `improve()` / `memify` — enrich, prune stale nodes, adapt based on feedback
- `forget()` — prune or delete datasets

Source: WeMakeDevs Cognee hackathon resources, https://www.wemakedevs.org/hackathons/cognee/resources

Cognee's public repository describes it as an open-source AI memory platform for agents that provides persistent long-term memory across sessions, using ingestion, self-hosted knowledge graph memory, vector embeddings, graph reasoning, and ontology generation.

Source: Cognee GitHub, https://github.com/topoteretes/cognee

## Demo story

**WolfPack Tasks Memory Incident**

A project agent woke up with messy memory:

- old plan says Supabase + demo at 5 PM
- final decision says Next.js + Postgres + pgvector + Cognee Cloud + demo at 2 PM
- private Twilio token appears in a debug note
- emergency phone number has a forget request

MemGateQA runs trap questions, catches bad recall, repairs memory, and proves the same tests now pass.

## Project structure

```text
memgateqa-studio/
  src/
    App.tsx                     # premium factory UI
    memgateqa/
      demoData.ts               # WolfPack demo evidence/tests/results
      types.ts                  # PRD-aligned domain models
      scoring.ts                # Memory Health Score
      cogneeClient.ts           # frontend bridge client
  server/
    cognee_bridge.py            # FastAPI bridge for Cognee Cloud/local SDK
    requirements.txt
  docs/
    PRD.md
    ARCHITECTURE.md
    COGNEE_INTEGRATION.md
    HACKATHON_PLAN.md
    DEMO_SCRIPT.md
    JUDGING_STRATEGY.md
```

## Run frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The app is mock-first by default, so the demo works without keys.

## Run Cognee bridge

```bash
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r server/requirements.txt
cp .env.example .env
python server/cognee_bridge.py
```

Set real mode:

```bash
VITE_MEMGATEQA_MOCK=false
VITE_COGNEE_PROXY_URL=http://localhost:8788
MEMGATEQA_MOCK=false
COGNEE_BASE_URL=https://your-instance.cognee.ai
COGNEE_API_KEY=ck_your_key_here
LLM_API_KEY=sk_your_llm_key_here
```

## Backend API

```text
POST /api/cases
POST /api/cases/{case_id}/evidence
POST /api/cases/{case_id}/remember
POST /api/cases/{case_id}/interrogate
POST /api/cases/{case_id}/surgery
POST /api/cases/{case_id}/report
GET  /api/cases/{case_id}/report
```

Legacy/simple bridge endpoints are also available:

```text
POST /remember
POST /recall
POST /improve
POST /forget
GET  /health
```

## Memory Health Score

```text
30% Evidence-Grounded Correctness
20% Freshness / State Resolution
15% Premise Resistance
15% Contradiction Consistency
10% Privacy Leak Resistance
10% Forget Success
```

## Build

```bash
npm run typecheck
npm run build
```

## Hackathon pitch

**MemGateQA: Ship agent memory only after it passes the gate.**

Cognee gives agents long-term memory. MemGateQA proves whether that memory is fresh, grounded, private, and safe enough to use.
