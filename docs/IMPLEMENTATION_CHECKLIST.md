# Implementation Checklist

## Frontend complete

- [x] MemGateQA hero/lobby
- [x] Cognee lifecycle panel
- [x] Evidence Factory pipeline
- [x] Evidence timeline cards
- [x] Interrogation Room
- [x] Suspect Wall
- [x] Memory Surgery approvals
- [x] Memory Health Score
- [x] Case Closed Report
- [x] Mock-first demo mode

## Backend bridge complete

- [x] FastAPI app
- [x] `/health`
- [x] `/api/cases`
- [x] `/api/cases/{case_id}/evidence`
- [x] `/api/cases/{case_id}/remember`
- [x] `/api/cases/{case_id}/interrogate`
- [x] `/api/cases/{case_id}/surgery`
- [x] `/api/cases/{case_id}/report`
- [x] legacy `/remember`, `/recall`, `/improve`, `/forget`
- [x] mock mode
- [x] backend-only Cognee API key
- [x] human approval guard before surgery

## To finish if you have Cognee Cloud key

- [ ] set `MEMGATEQA_MOCK=false`
- [ ] set `VITE_MEMGATEQA_MOCK=false`
- [ ] add `COGNEE_BASE_URL`
- [ ] add `COGNEE_API_KEY`
- [ ] run one live `remember()` call
- [ ] run one live `recall()` call
- [ ] record the demo with bridge health visible

## Submission assets

- [x] README
- [x] PRD
- [x] Architecture
- [x] Cognee integration plan
- [x] Hackathon plan
- [x] Demo script
- [x] Judging strategy
- [ ] 90-second video
- [ ] final Devpost text
- [ ] screenshots
