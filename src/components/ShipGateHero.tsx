import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { BridgeHealth } from '../api/memgateqaApi';
import { MemoryLifecyclePills } from './MemoryLifecyclePills';

interface ShipGateHeroProps {
  health: BridgeHealth | null;
  readyCount: number;
  auditCount: number;
}

export function ShipGateHero({ health, readyCount, auditCount }: ShipGateHeroProps) {
  const cogneeLive = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';

  return (
    <section className="ship-gate-hero">
      <div className="ship-gate-hero-glow" />
      <div className="ship-gate-hero-inner">
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 12 }}>
          <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-cyan-300">
            MemGateQA × Cognee · Open-source agent memory
          </p>
          <h1 className="ship-gate-hero-title">
            Prove Cognee memory
            <span className="ship-gate-hero-accent"> before you ship</span>
          </h1>
          <p className="ship-gate-hero-sub">
            Cognee stores what agents remember. MemGateQA tests whether that memory is trustworthy —
            using remember, recall, improve, and forget with trap tests, human-gated repair, and a
            deployable health certificate.
          </p>
          <div className="mt-4">
            <MemoryLifecyclePills active={['remember', 'recall', 'improve', 'forget']} compact fnStyle />
          </div>
        </motion.div>

        <div className="ship-gate-hero-actions">
          <Link className="ent-btn ent-btn-primary" to="/cases/case-wolfpack">
            Run WolfPack Memory Gate
          </Link>
          <Link className="ent-btn ent-btn-secondary" to="/cases/new">
            + New audit
          </Link>
        </div>

        <div className="ship-gate-hero-stats">
          <div className="ship-gate-stat">
            <span className="ship-gate-stat-val">{auditCount}</span>
            <span className="ship-gate-stat-label">Memory audits</span>
          </div>
          <div className="ship-gate-stat">
            <span className="ship-gate-stat-val">{readyCount}</span>
            <span className="ship-gate-stat-label">Ship clear</span>
          </div>
          <div className="ship-gate-stat">
            <span className={`ship-gate-stat-dot ${cogneeLive ? 'live' : mode === 'mock' ? 'mock' : ''}`} />
            <span className="ship-gate-stat-val">{cogneeLive ? 'Cognee live' : mode === 'mock' ? 'Mock' : 'Bridge'}</span>
            <span className="ship-gate-stat-label">Cloud connection</span>
          </div>
          <div className="ship-gate-stat">
            <span className="ship-gate-stat-val">≥80%</span>
            <span className="ship-gate-stat-label">Gate threshold</span>
          </div>
        </div>
      </div>
    </section>
  );
}