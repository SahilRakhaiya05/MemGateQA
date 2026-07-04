const CAPABILITIES = [
  {
    icon: '📥',
    title: 'Evidence intake',
    body: 'Load planning notes, decisions, traces, and forget requests. Index with Cognee remember().',
  },
  {
    icon: '🔍',
    title: 'Six trap tests',
    body: 'Stale, contradiction, unsupported, privacy, forget, premise — recall() graded per category.',
  },
  {
    icon: '🔧',
    title: 'Human-gated repair',
    body: 'Approve improve() + forget() only. No silent memory mutation.',
  },
  {
    icon: '📊',
    title: 'Memory health score',
    body: 'Weighted breakdown: grounding, freshness, premise, contradiction, privacy, forget.',
  },
  {
    icon: '📜',
    title: 'Deploy proof',
    body: 'Before/after scorecard and Memory Health Certificate when the gate clears 80%.',
  },
  {
    icon: '🔌',
    title: 'Cognee lifecycle',
    body: 'remember · recall · improve · forget — visible operation log on every case.',
  },
] as const;

export function ShipGateCapabilities() {
  return (
    <section className="ship-gate-capabilities">
      <div className="mb-4">
        <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Core workflow</p>
        <h2 className="font-sig text-lg font-bold text-white">Evidence → remember → recall → repair → proof</h2>
      </div>
      <div className="ship-gate-cap-grid">
        {CAPABILITIES.map((cap) => (
          <div key={cap.title} className="ship-gate-cap-card">
            <span className="ship-gate-cap-icon">{cap.icon}</span>
            <div>
              <p className="font-sig font-bold text-white">{cap.title}</p>
              <p className="mt-1 text-sm text-slate-500">{cap.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}