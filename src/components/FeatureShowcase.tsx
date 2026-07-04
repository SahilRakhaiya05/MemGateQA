import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '📥',
    title: 'Evidence intake',
    body: 'Queue documents on a live conveyor belt, tag sensitivity, and push approved items via remember().',
    path: '/cases/case-wolfpack/evidence',
    color: 'feature-cyan',
  },
  {
    icon: '🔍',
    title: 'Trap interrogation',
    body: 'Six failure modes — stale, contradiction, unsupported, privacy, forget, premise — tested against live recall().',
    path: '/cases/case-wolfpack/tests',
    color: 'feature-orange',
  },
  {
    icon: '⚖️',
    title: 'Suspect wall',
    body: 'Failures pin like a deposition board. Compare RAG vs Graph retrieval side-by-side per test.',
    path: '/cases/case-wolfpack/results',
    color: 'feature-amber',
  },
  {
    icon: '🔧',
    title: 'Memory surgery',
    body: 'Human-approved improve() + forget() with regression rerun. Score arc from 34% → 89%.',
    path: '/cases/case-wolfpack/surgery',
    color: 'feature-purple',
  },
  {
    icon: '📋',
    title: 'Health certificate',
    body: 'Exportable proof for compliance gates, deploy sign-off, and stakeholder audits.',
    path: '/cases/case-wolfpack/report',
    color: 'feature-emerald',
  },
  {
    icon: '🧠',
    title: 'Memory graph',
    body: 'Interactive Cognee knowledge graph with node highlighting on failure paths.',
    path: '/cases/case-wolfpack',
    color: 'feature-blue',
  },
] as const;

export function FeatureShowcase() {
  return (
    <section className="feature-showcase">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-400">Platform capabilities</p>
          <h2 className="font-sig text-2xl font-bold text-white">Everything in one QA factory</h2>
        </div>
        <Link className="ent-btn ent-btn-ghost ent-btn-sm" to="/cases/case-wolfpack">
          Explore WolfPack →
        </Link>
      </div>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Link className={`feature-card ${f.color}`} to={f.path}>
              <span className="feature-card-glow" />
              <span className="feature-icon">{f.icon}</span>
              <h3 className="font-sig text-sm font-bold uppercase tracking-wide text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              <span className="feature-link">Open station →</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}