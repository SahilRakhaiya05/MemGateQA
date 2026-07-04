import { motion } from 'framer-motion';

const HIGHLIGHTS = [
  { icon: '🏭', title: '2D sortation line', body: 'Live conveyor belt with manila packets, station pipeline, and handler booth HUD.' },
  { icon: '🔍', title: 'Trap interrogation', body: 'Six automated failure modes run against live recall() with suspect wall pinning.' },
  { icon: '⚖️', title: 'RAG vs Graph', body: 'Three-column retrieval compare per test — see exactly where memory breaks.' },
  { icon: '🔧', title: 'Human-approved repair', body: 'improve() + forget() surgery with regression rerun before deploy.' },
  { icon: '📋', title: 'Ship certificate', body: 'Exportable Memory Health proof for compliance gates and stakeholder sign-off.' },
  { icon: '🛡️', title: 'Deploy gate', body: 'Score ≥ 80% required to clear production — blocked until repair passes.' },
] as const;

export function PlatformHighlights() {
  return (
    <section className="platform-highlights">
      <div className="mb-6">
        <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-400">Built-in platform</p>
        <h2 className="font-sig text-2xl font-bold text-white">Everything ships in one audit factory</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          MemGateQA is a production QA layer for Cognee agent memory — evidence intake, trap tests, repair workflow,
          and compliance proof. No plugins required.
        </p>
      </div>
      <div className="platform-highlight-grid">
        {HIGHLIGHTS.map((h, i) => (
          <motion.div
            key={h.title}
            animate={{ opacity: 1, y: 0 }}
            className="platform-highlight-card"
            initial={{ opacity: 0, y: 14 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="text-2xl">{h.icon}</span>
            <h3 className="mt-3 font-sig text-sm font-bold uppercase tracking-wide text-white">{h.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{h.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}