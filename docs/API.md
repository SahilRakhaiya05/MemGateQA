# MemGateQA API Reference

MemGateQA exposes a FastAPI bridge at `http://localhost:8788` by default. Interactive OpenAPI docs are available at `/docs` and `/redoc`.

**Bridge version:** 3.4.0  
**Total routes:** 73 (including legacy Cognee proxy endpoints)

All JSON responses use the envelope:

```json
{
  "ok": true,
  "mode": "mock | proxy",
  "data": { }
}
```

---

## Health & Integrations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Bridge health, Cognee reachability, case count |
| `GET` | `/api/integrations` | Cognee, LLM, MCP, and loop-engineering status |
| `GET` | `/api/integrations/developer` | Developer manifest (SDK, CLI, MCP tools) |
| `GET` | `/api/integrations/mcp-config` | MCP server configuration JSON |
| `GET` | `/api/integrations/rbac` | Cognee RBAC probe status |

---

## Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings` | Workspace settings (secrets masked) |
| `PUT` | `/api/settings` | Update workspace settings |
| `GET` | `/api/settings/llm/models` | List available OpenAI/Gemini models |
| `GET` | `/api/llm/model-tiers` | Model tier definitions |
| `POST` | `/api/settings/test/llm` | Test LLM connectivity |
| `POST` | `/api/settings/test/cognee` | Test Cognee Cloud connectivity |
| `POST` | `/api/webhooks/test` | Dispatch test webhook event |

---

## Cases (CRUD)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases` | List all cases |
| `POST` | `/api/cases` | Create a new case |
| `GET` | `/api/cases/{case_id}` | Get case with evidence, tests, results |
| `DELETE` | `/api/cases/{case_id}` | Delete case |

**Create case body:**

```json
{
  "name": "My Audit",
  "agent": "Support Bot",
  "dataset": "memgateqa_support",
  "description": "Optional risk description"
}
```

---

## Evidence

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/evidence/parse` | Parse pasted text, URL, or filename into chunks |
| `POST` | `/api/cases/{case_id}/evidence` | Add evidence document to case |
| `DELETE` | `/api/cases/{case_id}/evidence/{evidence_id}` | Remove evidence |

**Parse evidence body:**

```json
{
  "text": "Markdown or prose to chunk",
  "url": "https://optional-source.example/doc",
  "filename": "optional-label.md"
}
```

---

## Memory Tests (Traps)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/tests` | Add memory trap test |
| `DELETE` | `/api/cases/{case_id}/tests/{test_id}` | Remove test |

**Test categories:** `stale`, `contradiction`, `privacy`, `forget`, `unsupported`, `premise`, `freshness`, `decoy`

---

## Cognee Lifecycle

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/remember` | Index evidence into Cognee + MemGate |
| `POST` | `/api/cases/{case_id}/interrogate` | Run trap tests against recall (`?rerun=false`) |
| `POST` | `/api/cases/{case_id}/surgery` | Human-approved memory repair (improve/forget) |
| `POST` | `/api/cases/{case_id}/rerun` | Re-interrogate after repair |
| `POST` | `/api/cases/{case_id}/compare` | Compare before/after result for a test |
| `POST` | `/api/cases/{case_id}/reply-gate` | Pre-ship reply safety check |

**Surgery requires** `approvedByHuman: true`. Reviewer role cannot execute `forget()`.

---

## Autonomous Gate

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/gate/run` | Run full autonomous gate loop |
| `GET` | `/api/cases/{case_id}/gate/status` | Gate phase status and health |
| `POST` | `/api/cases/{case_id}/gate/watch/start` | Start background gate watcher |
| `POST` | `/api/cases/{case_id}/gate/watch/stop` | Stop gate watcher |

Gate phases: observe → index → interrogate → diagnose → repair → verify → certify

---

## Agent Builder & Fleet

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agents/templates` | List agent templates |
| `POST` | `/api/agents/builder/chat` | Chat-first agent builder turn |
| `POST` | `/api/agents/create-from-chat` | Create case from builder scaffold |
| `POST` | `/api/agents/create` | Create agent from template |
| `PATCH` | `/api/agents/{case_id}/config` | Update agent LLM config |
| `POST` | `/api/agents/{case_id}/launch` | Launch agent + optional gate watch |
| `POST` | `/api/agents/{case_id}/publish` | Publish/unpublish public agent link |
| `GET` | `/api/agents/mine` | List agents by owner |
| `POST` | `/api/agent/run-fleet` | Run auto-agent across fleet |

---

## Public Agents (rate-limited)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/public/agents/{slug}` | Sanitized public agent profile |
| `POST` | `/api/public/agents/{slug}/chat` | Public agent chat (max 4000 char message, 64KB body) |

---

## Agent Chat & Loop

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/agent/chat` | Agent chat with hybrid recall |
| `GET` | `/api/cases/{case_id}/agent/chat/history` | Chat history |
| `DELETE` | `/api/cases/{case_id}/agent/chat/history` | Clear chat history |
| `POST` | `/api/cases/{case_id}/agent/loop` | Run single loop-engineering step |
| `GET` | `/api/cases/{case_id}/agent/state` | Loop state and ledger preview |
| `POST` | `/api/cases/{case_id}/agent/gap-fill` | AI repair plan for failures |
| `POST` | `/api/cases/{case_id}/agent/run-all` | Full auto-agent pipeline |

---

## Loop Runner

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/loop/run-full` | Full observe→recall→grade→plan cycle |
| `POST` | `/api/cases/{case_id}/loop/auto/start` | Start background auto-loop |
| `POST` | `/api/cases/{case_id}/loop/auto/stop` | Stop auto-loop |
| `GET` | `/api/cases/{case_id}/loop/auto/status` | Auto-loop status |
| `GET` | `/api/cases/{case_id}/loop/ledger` | Loop ledger entries |

---

## MemGate Memory Engine

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/memory/add` | Add fact to local memory container |
| `POST` | `/api/cases/{case_id}/memory/search` | Hybrid memory search |
| `GET` | `/api/cases/{case_id}/memory/profile` | Container profile |
| `GET` | `/api/cases/{case_id}/memory/context` | Built context block |
| `POST` | `/api/cases/{case_id}/memory/forget` | Forget local memory fact |

---

## Reports, Graph & Proof

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases/{case_id}/report` | Generate/read ship report |
| `POST` | `/api/cases/{case_id}/report` | Generate ship report |
| `GET` | `/api/cases/{case_id}/graph` | Cognee knowledge graph |
| `GET` | `/api/cases/{case_id}/ops` | Cognee call log (scrubbed) |
| `GET` | `/api/cases/{case_id}/proof-bundle` | ZIP proof bundle export |
| `GET` | `/api/cases/{case_id}/activity/spans` | Activity spans / call log fallback |

---

## Schema & Wiki

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases/{case_id}/schema/inventory` | Cognee schema inventory |
| `GET` | `/api/cases/{case_id}/schema/provenance` | Schema provenance |
| `GET` | `/api/cases/{case_id}/wiki/audit` | Wiki audit node/edge counts |

---

## Audit

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cases/{case_id}/audit/auto` | Auto audit pipeline |

---

## Legacy Cognee Proxy

These endpoints mirror Cognee Cloud lifecycle ops for SDK compatibility:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/remember` | Legacy remember |
| `POST` | `/recall` | Legacy recall |
| `POST` | `/improve` | Legacy improve |
| `POST` | `/forget` | Legacy forget |

---

## Configuration

Environment variables are centralized in `server/config.py` (pydantic-settings). Key variables:

| Variable | Required when | Description |
|----------|---------------|-------------|
| `COGNEE_API_KEY` | `MEMGATEQA_MOCK=false` | Cognee Cloud API key |
| `COGNEE_BASE_URL` | Live mode | Cognee tenant URL |
| `MEMGATEQA_MOCK` | — | `true` for offline mock Cognee |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | LLM features | LLM provider keys |
| `MEMGATEQA_AUTONOMOUS` | — | Auto-gate after remember (default `true`) |

Startup fails fast with a clear error if `COGNEE_API_KEY` is missing and mock mode is disabled.