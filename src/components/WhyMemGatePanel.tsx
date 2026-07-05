const LIFECYCLE = [
  {
    op: 'remember()',
    role: 'Indexer',
    color: '#00f5ff',
    desc: 'Ingest evidence into Cognee — text becomes structured graph nodes.',
  },
  {
    op: 'recall()',
    role: 'Inspector',
    color: '#EF5A2A',
    desc: 'Trap questions query memory — semantic search + graph traversal.',
  },
  {
    op: 'improve()',
    role: 'Surgeon',
    color: '#a78bfa',
    desc: 'AI applies feedback — fix stale facts, contradictions, wrong premises.',
  },
  {
    op: 'forget()',
    role: 'Privacy officer',
    color: '#f87171',
    desc: 'Surgically delete sensitive data — then traps verify it stays gone.',
  },
] as const;

const OPERATORS = [
  { icon: 'QA', name: 'QA Handler', job: 'Runs trap tests on recall() answers and scores pass/fail.' },
  { icon: 'CG', name: 'Cognee Operator', job: 'Calls remember(), memify(), and syncs your dataset.' },
  { icon: 'IO', name: 'Belt', job: 'Shows one memory packet at a time — index → inspect → repair.' },
] as const;

export function WhyMemGatePanel() {
  return (
    <section className="why-memgate space-y-6">
      <div className="why-memgate-hero ent-card p-5">
        <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Why MemGateQA?</p>
        <h2 className="font-sig text-xl font-bold text-white">Cognee gives memory. MemGateQA proves it is safe to ship.</h2>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl">
          Cognee&apos;s <code className="text-cyan-300">remember()</code> and <code className="text-cyan-300">recall()</code>{' '}
          build agent memory — but agents still leak secrets, remember stale facts, and fail to forget. MemGateQA is the{' '}
          <strong className="text-white">QA layer</strong> that tests your Cognee graph before production: automated traps,
          health score, AI repair, and a deploy certificate.
        </p>
        <ul className="why-memgate-bullets mt-4 grid gap-2 sm:grid-cols-2 text-sm text-slate-400">
          <li>✓ Catches privacy leaks before users see them</li>
          <li>✓ Verifies forget() actually removes data</li>
          <li>✓ Scores memory health 0–100 with category breakdown</li>
          <li>✓ One-click full audit — no MCP or SDK required</li>
        </ul>
      </div>

      <div className="why-memgate-grid grid gap-4 lg:grid-cols-2">
        <div className="ent-card p-5">
          <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">Automatic pipeline</p>
          <h3 className="font-sig text-lg font-bold text-white">What happens when you press Run audit</h3>
          <ol className="auto-pipeline-steps mt-4 space-y-3">
            {[
              'INDEX — remember() loads all evidence into your Cognee dataset',
              'TRAP — recall() fires every trap question; answers are graded',
              'DIAGNOSE — AI analyzes failures and writes a repair plan',
              'REPAIR — improve() + forget() fix stale, private, and deleted memory',
              'VERIFY — recall() again; health score must reach 80% to ship',
              'CERTIFY — Memory Health Certificate + proof bundle',
            ].map((step, i) => (
              <li key={i} className="auto-pipeline-step">
                <span className="auto-pipeline-num">{i + 1}</span>
                <span className="text-sm text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="ent-card p-5">
          <p className="font-hud text-[10px] uppercase tracking-wider text-orange-300">Belt operators</p>
          <h3 className="font-sig text-lg font-bold text-white">Who does what on the belt</h3>
          <ul className="mt-4 space-y-3">
            {OPERATORS.map((op) => (
              <li key={op.name} className="operator-card">
                <span className="operator-icon">{op.icon}</span>
                <div>
                  <p className="font-sig font-bold text-white">{op.name}</p>
                  <p className="text-sm text-slate-400">{op.job}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ent-card p-5">
        <p className="font-hud text-[10px] uppercase tracking-wider text-emerald-300">Cognee lifecycle APIs</p>
        <h3 className="font-sig text-lg font-bold text-white">Core memory primitives MemGateQA exercises</h3>
        <div className="cognee-lifecycle-grid mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LIFECYCLE.map((item) => (
            <div className="cognee-lifecycle-card" key={item.op} style={{ borderColor: `${item.color}44` }}>
              <p className="font-hud text-xs font-bold" style={{ color: item.color }}>
                {item.op}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{item.role}</p>
              <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
