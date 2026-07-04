import { motion } from 'framer-motion';
import type { CaseRecord } from '../api/memgateqaApi';

interface GatePulseStripProps {
  cases: CaseRecord[];
}

export function GatePulseStrip({ cases }: GatePulseStripProps) {
  const ready = cases.filter((c) => (c.lastScore ?? 0) >= 80).length;
  const blocked = cases.filter((c) => c.lastScore != null && (c.lastScore ?? 0) < 80).length;
  const pending = cases.filter((c) => c.lastScore == null).length;
  const totalTests = cases.reduce((s, c) => s + (c.tests?.length ?? 0), 0);
  const totalEvidence = cases.reduce((s, c) => s + (c.evidence?.length ?? 0), 0);
  const avgScore =
    cases.filter((c) => c.lastScore != null).length > 0
      ? Math.round(
          cases.filter((c) => c.lastScore != null).reduce((s, c) => s + (c.lastScore ?? 0), 0) /
            cases.filter((c) => c.lastScore != null).length,
        )
      : null;

  const metrics = [
    { label: 'Audits', value: String(cases.length), sub: 'active dossiers', pulse: true },
    { label: 'Ship clear', value: String(ready), sub: '≥ 80% health', tone: 'success' as const },
    { label: 'Blocked', value: String(blocked), sub: 'gate failures', tone: 'warning' as const },
    { label: 'Pending', value: String(pending), sub: 'awaiting tests', tone: 'muted' as const },
    { label: 'Trap tests', value: String(totalTests), sub: `${totalEvidence} evidence`, pulse: true },
    { label: 'Avg health', value: avgScore != null ? `${avgScore}%` : '—', sub: 'fleet score', tone: 'accent' as const },
  ];

  return (
    <div className="gate-pulse-strip">
      <div className="gate-pulse-header">
        <span className="gate-pulse-live">
          <span className="gate-pulse-dot" />
          Gate telemetry
        </span>
        <span className="gate-pulse-time font-hud text-[9px] uppercase tracking-widest text-slate-500">
          Live · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="gate-pulse-grid">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            animate={{ opacity: 1, y: 0 }}
            className={`gate-pulse-cell ${m.tone ?? ''}`}
            initial={{ opacity: 0, y: 6 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="gate-pulse-label">{m.label}</span>
            <span className="gate-pulse-value">
              {m.value}
              {m.pulse ? <span className="gate-pulse-ring" /> : null}
            </span>
            <span className="gate-pulse-sub">{m.sub}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}