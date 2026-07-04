import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArcadeCabinet } from '../arcade/ArcadeCabinet';
import { GoButton } from '../arcade/GoButton';

const STATS = [
  { value: '6', label: 'Trap categories' },
  { value: '80%', label: 'Ship threshold' },
  { value: '5', label: 'Pipeline stages' },
  { value: '∞', label: 'Regression runs' },
] as const;

export function EnterpriseHero() {
  const navigate = useNavigate();

  return (
    <ArcadeCabinet subtitle="Sortation arena lobby · insert audit to begin" title="⚡ MEMGATE QA">
      <div className="lobby-hero">
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} transition={{ duration: 0.45 }}>
          <p className="lobby-badge">
            <span className="lobby-badge-dot" />
            2D sortation belt · live Cognee bridge · coin-op audit UI
          </p>
          <h1 className="lobby-title">
            Ship agent memory <span className="lobby-title-accent">only after it passes the gate.</span>
          </h1>
          <p className="lobby-desc">
            MemGateQA is the QA sortation arena for Cognee agent memory. Queue evidence on the belt, run trap
            interrogation against live <code className="font-hud text-cyan-300">recall()</code>, approve surgery, and
            stamp the ship certificate.
          </p>

          <div className="lobby-actions">
            <GoButton label="START AUDIT" onClick={() => navigate('/cases/new')} size="lg" />
            <Link className="ent-btn ent-btn-secondary" to="/cases/case-wolfpack">
              WolfPack reference case
            </Link>
          </div>

          <div className="hero-stats-row">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                animate={{ opacity: 1, scale: 1 }}
                className="hero-stat"
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="lobby-cards"
          initial={{ opacity: 0, x: 16 }}
          transition={{ delay: 0.1 }}
        >
          <LobbyCard accent="orange" body="Gate releases on Memory Health ≥ 80 before deploy." icon="🏭" title="Platform teams" />
          <LobbyCard accent="green" body="forget() · privacy refusal · GDPR-style removal verified." icon="🛡️" title="Compliance" />
          <LobbyCard accent="blue" body="Regression suite after every memory surgery." icon="⚙️" title="AI engineers" />
        </motion.div>
      </div>
    </ArcadeCabinet>
  );
}

function LobbyCard({
  title,
  body,
  icon,
  accent,
}: {
  title: string;
  body: string;
  icon: string;
  accent: 'orange' | 'green' | 'blue';
}) {
  return (
    <div className={`lobby-card lobby-card-${accent}`}>
      <span className="text-xl">{icon}</span>
      <h3 className="font-sig text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}