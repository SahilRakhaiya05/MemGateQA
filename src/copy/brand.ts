/** User-facing copy — professional product tone */

export const BRAND = {
  name: 'MemGateQA',
  tagline: 'Ship memory you can trust',
  subtag: 'Chat to build agents · run the belt · share when clear',
} as const;

export const NAV = {
  home: { label: 'Home', hint: 'Live belt + your agents' },
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
  game: 'Recall runner',
  compare: 'RAG vs graph',
  desk: 'Memory desk',
  pipeline: 'Full workflow',
  pipelineSub: 'Every case runs the same A–Z pipeline — jump to any station.',
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
    'Clinical Memory DNA Officer — trial protocols, search intent tags, GDPR forget traps',
    'Support agent — knows our stack, never shares secrets',
    'Incident commander — postmortems, stale runbooks, privacy traps',
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