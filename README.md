# MemGateQA

![CI](https://github.com/SahilRakhaiya05/MemGateQA/actions/workflows/ci.yml/badge.svg)

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
  start.ps1
```

## Autonomous Memory Gate (full AI automation)

MemGateQA runs as a **closed-loop AI agent** — not just a manual UI:

```text
remember() → trap tests → Gemini diagnoses failures → improve + forget → verify → certificate
         ↑___________________________________________|  (loops until ≥80% or 3 cycles)
```

| Trigger | Command |
|---------|---------|
| **Zero-click** | Add evidence or `remember()` — gate auto-runs when `MEMGATEQA_AUTONOMOUS=true` |
| **One button** | Dashboard / Case Overview → **Run autonomous gate** |
| **WolfPack GO** | Full autonomous pipeline + certificate |
| **CLI** | `npm run gate` |
| **MCP** | `memgateqa_autonomous_gate` — hook any agent after it writes Cognee memory |
| **Watch mode** | Re-runs every 3 min until ship-ready |

Your external agent pattern:
```text
agent.remember(fact)  →  MCP memgateqa_autonomous_gate  →  ship only if score ≥ 80
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
GEMINI_API_KEY=your_gemini_key   # optional — not required for core Cognee QA flow
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
30% Evidence-grounded correctness  (BEAM: Abstention)
20% Freshness / state resolution    (BEAM: Knowledge Update + Temporal Reasoning)
15% Premise resistance
15% Contradiction consistency      (BEAM: Contradiction Resolution)
10% Privacy leak resistance        (MemGateQA extension — not in BEAM)
10% Forget success                 (MemGateQA extension — not in BEAM)
```

Trap categories map to [BEAM](https://cognee.ai/blog/deep-dives) dimensions where applicable; privacy and forget are production-safety extensions no other hackathon entry centers.

## Build

```bash
npm run typecheck
npm run build
```

## Security

- Never commit `.env`
- Rotate keys if they were exposed
- Cognee calls only through `server/cognee_bridge.py`

## Pitch

> Cognee gives agents long-term memory. MemGateQA is the testing, repair, and proof layer that tells you whether that memory is safe enough to ship.

## Disclosures

Per WeMakeDevs × Cognee Hackathon 2026 Rule 8, this submission was built with AI coding assistants. Tools used:

| Tool | Role |
|------|------|
| **Cursor** | Primary IDE and agent-assisted code generation, refactoring, and debugging |
| **Grok (xAI)** | Architecture planning, competitive analysis, and implementation spec |
| **Claude Code** | Referenced in hackathon disclosure pattern; occasional code review |
| **Gemini 2.5 Flash** | In-app LLM provider for agent chat, gap-fill repair plans, and loop engineering (`GEMINI_API_KEY`) |

All Cognee lifecycle operations (`remember`, `recall`, `improve`, `forget`, `memify`) execute against the Python bridge; trap grading and health scoring are deterministic Python. LLM output is advisory only — memory surgery requires explicit human approval.

## Judging criteria

| Criterion | How MemGateQA answers it |
|-----------|--------------------------|
| Potential Impact | Pre-production QA gate for silent memory failures (stale facts, privacy leaks, failed deletes) |
| Creativity & Innovation | Tests whether memory *should be trusted*, not just whether it works |
| Technical Excellence | Automated trap suite, CI, precise Cognee 1.0 API usage (TEMPORAL, NodeSets, provenance) |
| Best Use of Cognee | Full lifecycle + graph, schema inventory, chain-of-custody provenance |
| User Experience | 5-step flow: Evidence → Tests → Results → Surgery → Report |
| Presentation Quality | Deployed demo, `EVIDENCE.md` scorecard, reproducible `memgate_cli.py audit` |

## Evidence (open without running the app)

| Artifact | Contents |
|----------|----------|
| [`docs/EVIDENCE.md`](docs/EVIDENCE.md) | Full trap scorecard, decoy false-positive check, privacy/forget wedge |
| [`results/scorecard.json`](results/scorecard.json) | Machine-readable before/after per test + category breakdown |
| [`docs/COGNEE_API_ALIGNMENT.md`](docs/COGNEE_API_ALIGNMENT.md) | 1:1 mapping: health metrics → Cognee API primitives |

Regenerate: `npm run evidence`

## Cognee API alignment

Every health metric maps to a real Cognee primitive — see [`docs/COGNEE_API_ALIGNMENT.md`](docs/COGNEE_API_ALIGNMENT.md). Highlights:

- `evidenceGrounding` → `recall(includeReferences)`
- `freshness` → `recall(searchType: TEMPORAL)`
- `improve()` → `SearchType.FEEDBACK` + `remember/entry type:feedback`
- `memify()` → `POST /api/v1/cognify` (distinct from improve)
- `privacyLeakResistance` → `remember(node_set=private)` + scoped recall
- `forgetSuccess` → `POST /api/v1/forget` + negative recall proof