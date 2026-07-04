const EDGES = [
  { icon: '🎯', title: '6 trap categories', body: 'Stale, contradiction, unsupported, privacy, forget, premise — systematic QA gate.' },
  { icon: '⚖️', title: 'RAG vs Graph arena', body: 'Batch compare proves Cognee graph beats plain vector retrieval on failures.' },
  { icon: '📋', title: 'Memory lint export', body: 'Contradiction register with hard/soft/temporal severity — auditor-ready JSON.' },
  { icon: '🔧', title: 'Human-gated repair', body: 'Approved improve/forget only — no silent auto-mutation of agent memory.' },
  { icon: '📜', title: 'Deploy proof', body: 'Before/after health score + trap scorecard for ship gates ≥80%.' },
  { icon: '🔌', title: 'Mock or live Cognee', body: 'Runs without API keys; connects to Cloud when bridge is live.' },
];

export function CompetitiveEdgeStrip() {
  return (
    <section className="competitive-edge-strip">
      <div className="competitive-edge-head">
        <p className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">Why MemGateQA</p>
        <h2 className="font-sig text-lg font-bold text-white">The QA layer competitors skip</h2>
        <p className="mt-1 text-sm text-slate-400">
          Others build memory apps. MemGateQA gates memory before you ship it.
        </p>
      </div>
      <div className="competitive-edge-grid">
        {EDGES.map((e) => (
          <div key={e.title} className="competitive-edge-card">
            <span className="competitive-edge-icon">{e.icon}</span>
            <h3 className="font-sig text-sm font-semibold text-white">{e.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{e.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}