/** User-facing copy — single source of truth */

export const BRAND = {
  name: 'MemGateQA',
  /** Header under logo */
  navTagline: 'Memory QA for Cognee agents',
  /** Home hero — primary headline */
  heroTitle: 'Know if your agent memory is safe to ship',
  /** Home hero — supporting line */
  heroSub:
    'Run recall traps on live Cognee memory, approve repairs, and export proof before deploy.',
  /** Footer + tertiary */
  tagline: 'Test · repair · prove — the pre-deployment gate for agent memory.',
  /** Small kicker — submission context only */
  hackathon: 'WeMakeDevs × Cognee Hackathon 2026',
} as const;

export const NAV = {
  home: { label: 'Home', hint: 'Memory gate · your agents' },
  studio: { label: 'Memory Studio', hint: 'Graph · traps · compare · ship audit' },
  agents: { label: 'My agents', hint: 'Chat, test, publish' },
  create: { label: 'Build', hint: 'Describe your agent in chat — we do the rest' },
  settings: { label: 'Setup', hint: 'Cognee keys · models · webhooks' },
} as const;

export const STUDIO = {
  kicker: 'Memory Studio',
  title: 'Live memory operations',
  sub: 'Explore the graph, review witnesses, run recall traps, compare RAG vs graph, and audit ship health — per agent.',
  graph: 'Memory map',
  deposition: 'Witness wall',
  game: 'Trap runner',
  quest: 'Context quest',
  connect: 'Connect dots',
  ops: 'Lifecycle ops',
  compare: 'RAG vs graph',
  desk: 'Memory desk',
  pipeline: 'Full workflow',
  pipelineSub: 'Every case runs the same A–Z pipeline — jump to any station.',
} as const;

export const LIFECYCLE = {
  kicker: 'Cognee lifecycle',
  title: 'Memory operations console',
  sub: 'remember → recall → memify → forget — full lifecycle coverage per agent.',
  fileIt: 'File it',
  fileItSub: 'remember()',
  askHal: 'Ask memory',
  askHalSub: 'recall()',
  connectDots: 'Connect dots',
  connectDotsSub: 'memify()',
  purgeLies: 'Purge lies',
  purgeLiesSub: 'forget()',
} as const;

/** @deprecated Use STUDIO — kept for gradual migration */
export const FLOOR = STUDIO;

export const BUILD = {
  title: 'Build your agent',
  sub: 'Tell the LLM what to remember. It drafts facts, safety checks, and recall tests — then you chat and share.',
  chatTitle: 'Agent builder',
  chatSub: 'Plain English in · Cognee memory out',
  placeholder: 'Example: Support bot for our SaaS — knows pricing, never leaks API keys…',
  starters: [
    'Deep Research Agent — LUMEN policy papers, multi-hop graph recall, stale citation traps',
    'Atlas Research Copilot — HELIOS papers, lab notebooks, graph recall, stale citation traps',
    'Mnemosyne Context Keeper — personal memory, research graph, workflows, tutoring, support history',
    'Clinical Memory DNA Officer — trial protocols, PHI forget, confidential interim traps',
    'WolfPack Tasks assistant — stale Supabase trap, demo time, token leak, forget proof',
  ],
  thinking: 'Drafting your agent…',
  createCta: 'Launch agent',
} as const;

export const BELT = {
  kicker: 'Live belt',
  title: 'Operations belt',
  sub: 'Every agent gets the belt — recall traps, Cognee ops, real evidence packets. Hit GO for one full audit loop.',
  go: 'GO',
  running: 'RUNNING',
} as const;

export const WIKI = {
  kicker: 'Memory desk',
  title: 'Add · ask · verify',
  sub: 'Add memory, ask questions, verify recall — wired into ship-clear, not a side demo.',
  ingest: 'Add memory',
  query: 'Ask anything',
  lint: 'Verify recall',
  shipBlocked: 'Hold — fix memory first',
  lintClear: 'Clear to ship',
} as const;