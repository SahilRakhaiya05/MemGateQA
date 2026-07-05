# MemGateQA product and competitive audit

Date: 2026-07-05

## Executive decision

MemGateQA should not try to beat the field as another memory assistant, company brain, graph viewer, or Vegas game. Its strongest and most defensible product is:

> The pre-deployment test, repair, and proof gate for AI agent memory.

That wedge is meaningfully different from the competitors reviewed. The product already has the backend surface to support it: evidence ingestion, trap tests, deterministic grading, repair, verified reruns, privacy/forget checks, provenance, reports, CLI, MCP, autonomous gate, webhooks, and public proof bundles.

The main risk is not missing features. It is presentation and product focus. The current UI exposes too many parallel concepts—factory, arena, studio, agents, wiki, graph, lint, autonomous loops, developer tools—before the core value is understood. The winning version should make one result obvious in under 30 seconds:

1. Connect or select an agent memory.
2. Run the memory gate against real evidence.
3. See a pass/fail decision, repair safely, and export verifiable proof.

## Current-flow audit

Evidence is in `audit/screenshots/`.

### Step 1 — Home / product entry

Health: Needs focus.

Strengths:

- The one-line category, “Memory QA for Cognee agents,” is differentiated.
- The page visibly demonstrates Cognee lifecycle operations.
- The visual identity is memorable and stronger than a generic dashboard.

Issues:

- The first viewport prioritizes the WolfPack arena over the user’s job.
- The central action is visually ambiguous: “open case,” “GO,” Studio, Create, and My agents compete.
- The copy describes implementation verbs before stating the business outcome.
- A new user cannot immediately answer: “What do I connect, what will be tested, and what do I get?”

Recommendation:

- Lead with “Know if your agent’s memory is safe to ship.”
- Use one primary CTA: `Run a memory gate`.
- Use one secondary CTA: `View verified example`.
- Put the live reference case below a compact three-step explanation.
- Show real integration status beside the CTA, not inside the decorative arena.

### Step 2 — Case overview

Health: Visually broken at the audited 1280×720 viewport.

Strengths:

- Ship status and health score are prominent.
- Lifecycle stages are visible.
- The “receipt” concept supports technical credibility.

Issues:

- Conveyor labels and cards overlap.
- The active packet and “THWACK” stamp obscure other information.
- The operational stage controls sit below a large repeated scene.
- “Ship clear” appears before the user sees which checks passed, making it feel asserted rather than proved.
- “Bridge offline” and “Cognee live” language can coexist in nearby surfaces, which weakens trust.

Recommendation:

- Replace the full arena on workflow pages with a 64–88 px compact progress rail.
- Reserve the immersive arena for the example/demo route only.
- Show a trust header with: environment, dataset, last live operation, gate version, and evidence timestamp.
- Make status conditional: `Not run`, `Blocked`, `Needs repair`, or `Ship clear`.

### Step 3 — Tests

Health: Functionally rich, poor information hierarchy.

Strengths:

- Trap categories cover stale facts, contradictions, unsupported claims, false premises, privacy, and verified forgetting.
- Tests map to a concrete release decision.

Issues:

- The user must scroll past the same case scene before reaching the test suite.
- “Run audit,” “Run Gate,” and category chips create competing execution models.
- The screen does not first separate configured tests from the latest run.

Recommendation:

- Make the page a proper test runner:
  - left: test suite and filters;
  - center: selected test with expected behavior and evidence scope;
  - right: latest result, raw recall, citations, and latency.
- Use one run action: `Run gate`.
- Put category-specific runs in an overflow menu.

### Step 4 — Results

Health: Strong underlying artifact, obscured by chrome.

Strengths:

- Before/after scoring, evidence citations, category scores, and failure details are the product’s strongest proof.
- Deterministic grading is more credible than a purely LLM-scored demo.

Issues:

- Results do not own the first viewport.
- The same decorative case scene makes Results visually indistinguishable from Tests and Surgery.
- A 100% reference state masks the more persuasive failing-memory story.

Recommendation:

- Open on the failing baseline by default for the reference case.
- Use an answer-first summary: `3 blockers prevent shipping`.
- Rank failures by severity: privacy/forget, unsupported claims, freshness, contradiction.
- Expose raw request/response receipts behind each result.

### Step 5 — Surgery / repair

Health: Valuable capability, needs safety framing.

Strengths:

- Human approval before mutation is a strong production stance.
- Improve and forget are treated as different operations.

Issues:

- “Surgery” is memorable but vague for enterprise users.
- The UI needs a clearer preview of exact writes/deletes and their scope.
- Repair confidence should come from rerunning the same tests, not from celebratory visuals.

Recommendation:

- Rename the primary task `Review repair plan`; retain “Memory surgery” as flavor text.
- For every mutation show: operation, target dataset/node set/data ID, reason, evidence, reversibility, and affected tests.
- Require explicit confirmation for destructive forget operations.
- After approval, automatically rerun only impacted tests, then offer the full gate.

### Step 6 — Proof / report

Health: Best commercial surface; promote it.

Strengths:

- Machine-readable scorecard, report, proof bundle, CLI, MCP, and webhook output create a real integration story.
- Privacy and forget verification are unusually strong differentiators.

Issues:

- Proof is currently the end of a long, visually dense route.
- The certificate can look ornamental unless it includes raw receipts and reproducibility metadata.

Recommendation:

- Make proof a first-class output, not a decorative certificate.
- Include gate version, test definitions hash, dataset ID, run timestamp, provider/search type, evidence references, before/after responses, mutation log, and verification outcome.
- Add copyable CI policy: `block deploy when critical failures > 0 or score < threshold`.

## Accessibility risks visible from screenshots

- Small HUD-style uppercase text is difficult to read.
- Several secondary labels have low contrast against dark translucent panels.
- Meaning depends heavily on neon color and glow.
- Decorative motion, particles, sound, and celebration need reduced-motion and sound-off defaults that persist.
- Overlapping cards can hide content and keyboard targets.
- Icon-only concepts need stable accessible names.

Screenshots cannot establish keyboard order, screen-reader output, focus visibility, target size, or live-region behavior. Those need interactive testing.

## Competitor map

| Project | Strongest idea | What it proves | Main weakness relative to MemGateQA |
|---|---|---|---|
| Vegas Amnesia | Memory lifecycle as a polished detective game | Exceptional theme fit and presentation | A game, not a reusable production gate |
| RealtyRecall | Narrow, high-value voice receptionist workflow | Real integrations, tenancy, booking, phone/SMS, secure forget | Vertical application, not memory QA infrastructure |
| RunbookOS | Incident graph that generates ranked runbooks | Real corpus, GraphRAG comparison, operational use case | Evaluates incident retrieval, not general memory safety |
| Cognost | Conflict-aware company brain with scored improvement | Strong evidence, decoy tests, provenance, before/after scores | One company-brain workflow; less focused on release gating and privacy deletion proof |
| Hindsight | Polished second brain and visible graph | Full lifecycle with cloud/self-hosted modes | Familiar “chat with memory” category |
| Wingman | Contradiction-aware reconstruction | Clear story and local/open-source positioning | Primarily a reconstruction experience |
| Hermes Remembers | Persistent ops-agent memory | Simple, credible four-operation API | Broad memory layer without a rigorous quality gate |
| Realty/Service/Studio/Waypoint projects | Vertical memory companions | Domain-specific usefulness | Narrower technical proof or unfinished surfaces |
| Cynergy projects | Continuity/deposition concepts | Domain narratives | Weak repository documentation and less inspectable evidence |
| ClinXplain / Wiki entries | RAG, wiki, and lint workflows | Technical breadth | Compete in crowded retrieval/wiki categories |

## How MemGateQA wins

### 1. Own the category

Do not pitch “an agent with memory.” Pitch “the test suite and deployment gate for any Cognee agent.”

### 2. Demonstrate failure, not happy-path recall

The most persuasive demo is:

1. an existing agent gives a plausible but unsafe answer;
2. MemGateQA catches the exact failure;
3. a human reviews the proposed mutation;
4. the same test reruns;
5. the proof bundle shows the before/after receipts.

### 3. Make privacy and forgetting the headline moat

Many entries call `forget()`. MemGateQA verifies that the deleted fact cannot be recovered, records the negative proof, and can block release when deletion fails. This is materially stronger.

### 4. Use real integrations as the judge path

The primary path should require and display a real Cognee connection. The WolfPack reference case should be explicitly labeled `Verified reference case`, never silently mixed with live state.

### 5. Be inspectable

Every score should open into:

- the test definition;
- expected behavior;
- raw recall output;
- Cognee references;
- deterministic grading reason;
- repair mutation;
- rerun output.

This is the antidote to “demo magic.”

## Product architecture recommendation

Primary navigation:

- Gates
- Agents
- Proof
- Integrations

Primary object model:

- Agent: connection and memory scope
- Gate: reusable policy/test suite
- Run: immutable execution with receipts
- Finding: one failed expectation
- Repair plan: reviewed mutations
- Proof bundle: signed/exportable run artifact

Primary user journey:

1. Create gate
2. Connect Cognee dataset/agent
3. Add evidence or import existing memory scope
4. Configure tests
5. Run
6. Review findings
7. Approve repair
8. Verify
9. Export proof / enforce in CI

## Real-product completion criteria

Before calling the product ready:

- No route should silently fall back to seeded frontend data when live mode is selected.
- Every visible “live” state must be backed by a successful health check and a recent operation receipt.
- The reference case must be visually and semantically separated from user-created gates.
- Empty, loading, partial, offline, permission-denied, and rate-limited states must be explicit.
- Destructive forget actions must show scope and require confirmation.
- Public share links must redact private evidence and raw secrets by default.
- A fresh user must be able to create a case, connect Cognee, add evidence/tests, run, repair, rerun, and export without editing code.
- CLI/MCP results and UI results must use the same grading and proof model.
- End-to-end tests should cover a live-compatible contract, not only deterministic grading.

## Recommended implementation order

1. Fix the workflow hierarchy and overlapping case layout.
2. Separate live state from the verified reference case.
3. Consolidate execution into one gate runner.
4. Promote findings and proof above decorative chrome.
5. Add trust metadata and raw receipts to every result.
6. Harden destructive forget and public redaction.
7. Lazy-load the 3D/arena experience; the production build is currently about 1.95 MB before gzip.

## Verification performed

- Frontend TypeScript/Vite production build: passed.
- Python grading tests: 13 passed.
- Build warning: the main JavaScript bundle is approximately 1.95 MB (547 KB gzip).
- Current repository contains substantial uncommitted work; this audit did not overwrite it.
