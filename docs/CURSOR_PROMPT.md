# Cursor / Codex Master Prompt

You are working on MemGateQA, a Cognee hackathon project.

Goal:
Make a premium, hackathon-winning AI memory QA factory. Cognee is the memory layer. MemGateQA is the test, repair, and proof layer.

Do not build a generic chatbot. Do not make it look like a game clone. Keep the factory metaphor but make it feel like a serious AI devtool.

Core flow:

1. Open Memory Case
2. Evidence enters the Factory pipeline
3. Approved evidence goes to Cognee with `remember()`
4. Interrogation Room runs `recall()` trap questions
5. Suspect Wall classifies failures
6. Memory Surgery requires human approval
7. Backend calls `improve()` and `forget()`
8. Case Closed Report proves before/after Memory Health Score

Tech stack:

- React + Vite + TypeScript + Tailwind
- FastAPI backend bridge
- Cognee SDK / Cognee Cloud from server only
- mock-first demo mode

Important rule:
Never expose `COGNEE_API_KEY` or `LLM_API_KEY` in frontend code.

Frontend files:

- `src/App.tsx`
- `src/memgateqa/demoData.ts`
- `src/memgateqa/types.ts`
- `src/memgateqa/scoring.ts`
- `src/memgateqa/cogneeClient.ts`

Backend file:

- `server/cognee_bridge.py`

Keep the demo case:

- Old memory: Supabase + demo 5 PM
- New truth: Next.js + Postgres + pgvector + Cognee Cloud + demo 2 PM
- Private token: should not be recalled
- Emergency phone: forget verification

Improve next:

- add export JSON button
- add screenshot-friendly final report
- connect live bridge health to UI
- add one real Cognee recall result panel
- improve mobile layout
- add Devpost copy in README
