# Implementation Checklist

## Frontend

- [x] Dashboard + case workflow (Evidence → Tests → Results → Repair → Proof)
- [x] WolfPack reference case
- [x] Memory Health Score + breakdown
- [x] Cognee operation log panel
- [x] Mock mode (no API keys)
- [x] `npm run build` passes

## Backend (`server/`)

- [x] `cognee_bridge.py` — FastAPI bridge
- [x] `requirements.txt`
- [x] `GET /health`
- [x] `GET|POST /api/cases` + evidence/tests CRUD
- [x] `POST /api/cases/{id}/remember`
- [x] `POST /api/cases/{id}/interrogate`
- [x] `POST /api/cases/{id}/surgery`
- [x] `POST /api/cases/{id}/rerun`
- [x] `GET /api/cases/{id}/report`
- [x] `GET /api/cases/{id}/ops`
- [x] Mock mode with deterministic WolfPack recall
- [x] Real Cognee Cloud mode (keys in `.env` only, never in frontend)

## Real Cognee Cloud (when you have keys)

- [ ] Set `MEMGATEQA_MOCK=false` in `.env`
- [ ] Set `COGNEE_BASE_URL` + `COGNEE_API_KEY`
- [ ] Smoke-test `remember()` on WolfPack
- [ ] Smoke-test `recall()` on one trap
- [ ] Smoke-test `improve()` + `forget()` via Repair tab
- [ ] Record demo video with bridge health showing `cloud` mode

## Security

- [x] `.env` in `.gitignore`
- [x] `.env.example` with placeholders only
- [ ] Rotate any keys that were ever committed or shared in chat

## Submission zip

Run `.\scripts\build-submission.ps1` — includes `server/`, excludes `.env`, `node_modules`, `.git`.