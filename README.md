# MemGateQA

**QA, repair, and proof layer for Cognee-powered agent memory.**

MemGateQA tests whether an agent's memory is fresh, grounded, private, and safe before you trust it in production. It wraps Cognee's `remember`, `recall`, `improve`, and `forget` APIs in a repeatable workflow: ingest evidence, run trap tests, approve repair, rerun, and export proof.

## WolfPack Memory Gate (reference case)

A project AI assistant has wrong memory:

| Problem | Symptom |
|---------|---------|
| Stale plan | Agent says Supabase |
| Wrong time | Agent says 5 PM demo |
| False premise | Agent follows Supabase question |
| Privacy leak | Agent recalls Twilio token |
| Failed forget | Agent recalls deleted phone number |

MemGateQA indexes evidence into Cognee, runs traps, applies human-approved `improve()` + `forget()`, reruns, and exports a Memory Health Certificate.

## Architecture

```text
React UI (Vite)  →  FastAPI bridge (:8788)  →  Cognee Cloud
                         ↓
                  MemGate Memory Engine (local facts)
```

All Cognee API keys stay in the Python backend. The browser never sees secrets.

## Project structure

```text
memproof-factory/
  src/                 # React frontend
  server/
    cognee_bridge.py   # FastAPI bridge
    cognee_client.py   # Cognee HTTP client
    grading.py         # Trap grading + health score
    mock_cognee.py     # Deterministic mock for WolfPack
    seed.py            # WolfPack reference case
    requirements.txt
  docs/
  scripts/
    build-submission.ps1
  start.ps1
```

## Quick start

```powershell
.\start.ps1
```

Or manually:

```bash
npm install
python -m venv .venv
.venv\Scripts\pip install -r server\requirements.txt
cp .env.example .env
npm run dev:all
```

- Frontend: http://localhost:5173  
- Bridge: http://localhost:8788/health  

## Mock mode (no keys)

In `.env`:

```bash
MEMGATEQA_MOCK=true
VITE_MEMGATEQA_MOCK=true
```

WolfPack returns deterministic before/after recall answers. Operation logs show mock `remember` / `improve` / `forget` entries.

## Real Cognee mode

```bash
MEMGATEQA_MOCK=false
VITE_MEMGATEQA_MOCK=false
VITE_COGNEE_PROXY_URL=http://localhost:8788
COGNEE_BASE_URL=https://your-tenant.aws.cognee.ai
COGNEE_API_KEY=your_key_here
COGNEE_SESSION_ID=memgateqa
COGNEE_DATASET=default_dataset
GEMINI_API_KEY=your_gemini_key   # optional, for agent chat
```

## Demo flow

1. Open **WolfPack Memory Gate**
2. **Evidence** → Index Evidence (`remember()`)
3. **Tests** → Run Gate (`recall()` + grade)
4. **Results** → review failures
5. **Repair** → approve surgery (`improve()` + `forget()`)
6. Rerun traps → score should clear 80%
7. **Proof** → generate certificate

Watch the **Cognee operation log** on every case page.

## Core API routes

```text
GET  /health
GET  /api/cases
GET  /api/cases/{id}
POST /api/cases/{id}/remember
POST /api/cases/{id}/interrogate
POST /api/cases/{id}/surgery
POST /api/cases/{id}/rerun
GET  /api/cases/{id}/report
GET  /api/cases/{id}/ops
```

## Memory Health Score

```text
30% Evidence-grounded correctness
20% Freshness / state resolution
15% Premise resistance
15% Contradiction consistency
10% Privacy leak resistance
10% Forget success
```

## Build

```bash
npm run typecheck
npm run build
```

## Submission zip

```powershell
.\scripts\build-submission.ps1
```

Creates `MemGateQA-submission.zip` with `server/` included. Never include `.env`, `node_modules`, or `.git`.

## Security

- Never commit `.env`
- Rotate keys if they were exposed
- Cognee calls only through `server/cognee_bridge.py`

## Pitch

> Most projects show an agent that remembers. MemGateQA proves whether that memory is safe to trust — using Cognee remember, recall, improve, and forget to turn messy agent memory into a tested, repaired, reportable production gate.