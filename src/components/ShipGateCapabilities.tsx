const CAPABILITIES = [
  {
    icon: '🎯',
    title: 'Six trap gate',
    body: 'Stale, contradiction, unsupported, privacy, forget, premise — every failure typed and scored.',
  },
  {
    icon: '🧠',
    title: 'Hybrid memory engine',
    body: 'MemGate local facts + Cognee graph recall. Auto-index on evidence. Profile + context inject.',
  },
  {
    icon: '🔁',
    title: 'Auto loop audit',
    body: 'observe → recall → grade → plan → verify. MCP, SDK, and UI scheduler until ≥80% health.',
  },
  {
    icon: '⚖️',
    title: 'Retrieval arena',
    body: 'Batch RAG vs Graph compare on failed traps — prove graph traversal wins where vectors fail.',
  },
  {
    icon: '🔧',
    title: 'Human-gated repair',
    body: 'Approved improve() + forget() only. LLM gap-fill plans — never silent memory mutation.',
  },
  {
    icon: '📜',
    title: 'Deploy proof',
    body: 'Memory Health Certificate, lint export, trap scorecard — ship only after the gate clears.',
  },
  {
    icon: '🤖',
    title: 'Agent fabric',
    body: 'Gemini agent chat, Claude/Codex/Cursor MCP, TypeScript SDK — auto-audit on new memory.',
  },
  {
    icon: '🔌',
    title: 'Cognee lifecycle',
    body: 'remember · recall · improve · forget · memify — full Cloud integration with API receipts.',
  },
];

export function ShipGateCapabilities() {
  return (
    <section className="ship-gate-capabilities">
      <div className="ship-gate-cap-head">
        <p className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">Platform capabilities</p>
        <h2 className="font-sig text-xl font-bold text-white">What MemGateQA ships</h2>
        <p className="mt-1 text-sm text-slate-400">
          Memory apps store facts. MemGateQA proves they are safe to deploy.
        </p>
      </div>
      <div className="ship-gate-cap-grid">
        {CAPABILITIES.map((c, i) => (
          <article key={c.title} className="ship-gate-cap-card" style={{ animationDelay: `${i * 40}ms` }}>
            <span className="ship-gate-cap-icon">{c.icon}</span>
            <h3 className="font-sig text-sm font-semibold text-white">{c.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}