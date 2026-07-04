import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { BridgeHealth } from '../api/memgateqaApi';

interface ShipGateHeroProps {
  health: BridgeHealth | null;
  readyCount: number;
  auditCount: number;
}

export function ShipGateHero({ health, readyCount, auditCount }: ShipGateHeroProps) {
  const cogneeLive = health?.cognee_reachable;
  const llm = health?.integrations?.llm ?? 'offline';

  return (
    <section className="ship-gate-hero">
      <div className="ship-gate-hero-glow" />
      <div className="ship-gate-hero-inner">
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 12 }}>
          <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-cyan-300">MemGateQA · Cognee hackathon</p>
          <h1 className="ship-gate-hero-title">
            Gate agent memory
            <span className="ship-gate-hero-accent"> before you ship</span>
          </h1>
          <p className="ship-gate-hero-sub">
            Six trap categories, Cognee remember/recall/improve/forget, human-gated repair, and deploy proof —
            one workflow from evidence to ship-ready memory.
          </p>
        </motion.div>

        <div className="ship-gate-hero-actions">
          <Link className="ent-btn ent-btn-primary" to="/cases/case-wolfpack">
            Open WolfPack Memory Gate
          </Link>
          <Link className="ent-btn ent-btn-secondary" to="/cases/new">
            + New audit
          </Link>
        </div>

        <div className="ship-gate-hero-stats">
          <div className="ship-gate-stat">
            <span className="ship-gate-stat-val">{auditCount}</span>
            <span className="ship-gate-stat-label">Audits</span>
          </div>
          <div className="ship-gate-stat">
            <span className="ship-gate-stat-val">{readyCount}</span>
            <span className="ship-gate-stat-label">Ship clear</span>
          </div>
          <div className="ship-gate-stat">
            <span className={`ship-gate-stat-dot ${cogneeLive ? 'live' : ''}`} />
            <span className="ship-gate-stat-val">{cogneeLive ? 'Live' : 'Bridge'}</span>
            <span className="ship-gate-stat-label">Cognee Cloud</span>
          </div>
          <div className="ship-gate-stat">
            <span className="ship-gate-stat-val">{llm}</span>
            <span className="ship-gate-stat-label">LLM agent</span>
          </div>
        </div>
      </div>
    </section>
  );
}