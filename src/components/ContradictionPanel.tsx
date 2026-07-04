import { motion } from 'framer-motion';
import type { LintFinding } from '../lib/memoryLint';

const SEVERITY_LABEL: Record<LintFinding['severity'], string> = {
  hard: 'Hard conflict',
  soft: 'Soft drift',
  temporal: 'Temporal stale',
};

const SEVERITY_CLASS: Record<LintFinding['severity'], string> = {
  hard: 'contradiction-severity-hard',
  soft: 'contradiction-severity-soft',
  temporal: 'contradiction-severity-temporal',
};

interface ContradictionPanelProps {
  findings: LintFinding[];
}

export function ContradictionPanel({ findings }: ContradictionPanelProps) {
  if (!findings.length) return null;

  return (
    <section className="contradiction-panel">
      <div className="contradiction-panel-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-amber-300">Deposition engine</p>
          <h2 className="font-sig text-xl font-bold text-white">Contradiction register</h2>
          <p className="mt-1 text-sm text-slate-400">
            Hard, soft, and temporal conflicts flagged before repair — cynergy-style memory firewall.
          </p>
        </div>
        <div className="contradiction-counts">
          <Count label="Hard" value={findings.filter((f) => f.severity === 'hard').length} tone="hard" />
          <Count label="Temporal" value={findings.filter((f) => f.severity === 'temporal').length} tone="temporal" />
          <Count label="Soft" value={findings.filter((f) => f.severity === 'soft').length} tone="soft" />
        </div>
      </div>
      <div className="contradiction-list">
        {findings.map((f, i) => (
          <motion.article
            key={f.id}
            animate={{ opacity: 1, x: 0 }}
            className={`contradiction-card ${SEVERITY_CLASS[f.severity]}`}
            initial={{ opacity: 0, x: -8 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="contradiction-card-top">
              <span className={`contradiction-badge ${SEVERITY_CLASS[f.severity]}`}>{SEVERITY_LABEL[f.severity]}</span>
              <span className="font-hud text-[9px] uppercase text-slate-500">{f.category}</span>
            </div>
            <h3 className="font-sig text-base font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{f.detail}</p>
            <p className="mt-2 font-hud text-[9px] uppercase tracking-wide text-cyan-400/90">
              Repair → {f.repairHint}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`contradiction-count contradiction-count-${tone}`}>
      <span className="contradiction-count-num">{value}</span>
      <span className="contradiction-count-label">{label}</span>
    </div>
  );
}