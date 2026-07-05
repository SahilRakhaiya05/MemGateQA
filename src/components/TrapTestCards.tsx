import { motion } from 'framer-motion';
import type { TestItem } from '../api/memgateqaApi';
import { beamLabel, usesTemporalRecall } from '../lib/beamCategories';

const META: Record<string, { icon: string; color: string }> = {
  stale: { icon: '🕐', color: 'trap-stale' },
  contradiction: { icon: '⚡', color: 'trap-contradiction' },
  unsupported: { icon: '👻', color: 'trap-unsupported' },
  privacy: { icon: '🔒', color: 'trap-privacy' },
  forget: { icon: '🗑️', color: 'trap-forget' },
  premise: { icon: '🪤', color: 'trap-premise' },
  decoy: { icon: '🎯', color: 'trap-decoy' },
};

const SEV: Record<string, string> = {
  critical: 'sev-critical',
  high: 'sev-high',
  medium: 'sev-medium',
  low: 'sev-low',
};

interface TrapTestCardsProps {
  tests: TestItem[];
  onRemove?: (id: string) => void;
}

export function TrapTestCards({ tests, onRemove }: TrapTestCardsProps) {
  if (!tests.length) {
    return (
      <div className="trap-empty">
        <span className="text-4xl">🔍</span>
        <p className="mt-3 font-sig text-lg text-slate-300">Interrogation room empty</p>
        <p className="text-sm text-slate-500">Add trap tests to interrogate Cognee recall()</p>
      </div>
    );
  }

  return (
    <div className="trap-grid">
      {tests.map((t, i) => {
        const meta = META[t.category] ?? { icon: '❓', color: 'trap-stale' };
        const label = beamLabel(t.category);
        const sev = SEV[t.severity] ?? 'sev-medium';
        return (
          <motion.article
            key={t.id}
            animate={{ opacity: 1, y: 0 }}
            className={`trap-card ${meta.color}`}
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="trap-card-glow" />
            <header className="trap-card-head">
              <span className="trap-icon">{meta.icon}</span>
              <div className="flex-1">
                <h3 className="font-sig text-base font-bold text-white">{t.title}</h3>
                <p className="font-hud text-[9px] uppercase text-slate-400">{label}</p>
              </div>
              <span className={`trap-sev ${sev}`}>{t.severity}</span>
            </header>
            {usesTemporalRecall(t.category) ? (
              <p className="trap-temporal-badge font-hud text-[9px] uppercase text-violet-300">recall(TEMPORAL)</p>
            ) : t.category === 'privacy' ? (
              <p className="trap-temporal-badge font-hud text-[9px] uppercase text-emerald-300">recall(excludeNodeSets=private)</p>
            ) : null}
            <div className="trap-question">
              <span className="trap-q-label">recall()</span>
              <p>{t.question}</p>
            </div>
            <div className="trap-expected">
              <span className="trap-q-label">expected</span>
              <p>{t.expected}</p>
            </div>
            {onRemove ? (
              <button className="trap-remove" onClick={() => onRemove(t.id)} type="button">
                Remove trap
              </button>
            ) : null}
          </motion.article>
        );
      })}
    </div>
  );
}