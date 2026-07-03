# Hackathon Build Plan — MemGateQA

## Winning strategy

Do not pitch a generic memory chatbot. Pitch a **memory QA factory**.

Judges should understand in 10 seconds:

> Cognee gives agents memory. MemGateQA proves that memory is fresh, grounded, private, and safe.

## Build scope

Build one perfect case, not ten weak features.

Required demo loop:

```text
Open case → intake evidence → run recall tests → show failures → approve surgery → rerun tests → final proof report
```

## Day 1 — Core demo

- polish MemGateQA UI
- build WolfPack demo dataset
- implement deterministic before/after results
- make Memory Health Score visual
- make demo run without API keys

## Day 2 — Cognee bridge

- finish FastAPI bridge
- connect `remember`, `recall`, `improve`, `forget`
- add `.env.example`
- keep keys backend-only
- confirm one live `remember` + `recall` call if keys are available

## Day 3 — Wow factor

- improve Evidence Factory pipeline
- improve Suspect Wall
- add Memory Surgery approvals
- add final report table
- record smooth 90-second demo

## Day 4 — Submission

- write README
- add architecture diagram
- add demo script
- add limitations section
- add future roadmap
- record video with clear voiceover

## Submission title

**MemGateQA: QA for Cognee Agent Memory**

## Subtitle

**A memory inspection factory that tests, repairs, and proves Cognee-powered agent memory before production.**

## What to emphasize

- uses all important Cognee memory lifecycle APIs
- solves a real production problem
- not another chat-with-docs demo
- visual demo is easy to understand
- mock-first but real bridge-ready
- human approval before memory changes
- before/after score proves value

## What not to do

- do not overbuild auth, billing, teams, settings
- do not make it look like a game clone
- do not show only UI without Cognee explanation
- do not promise perfect safety; say it is a QA layer
- do not hide limitations

## Roadmap after hackathon

1. backend evaluator for live recall grading
2. GitHub/Slack/Linear evidence imports
3. CI memory tests before agent deployment
4. PDF report export
5. tenant isolation and audit logs
6. evidence-level forget mapping
7. MCP integration for agent tools
