import { motion } from 'framer-motion';
import type { CaseRecord } from '../../api/memgateqaApi';

interface EnterpriseMetricsProps {
  cases: CaseRecord[];
}

export function EnterpriseMetrics({ cases }: EnterpriseMetricsProps) {
  const withScore = cases.filter((c) => c.lastScore != null);
  const avgScore =
    withScore.length > 0
      ? Math.round(withScore.reduce((s, c) => s + (c.lastScore ?? 0), 0) / withScore.length)
      : null;
  const shipReady = cases.filter((c) => (c.lastScore ?? 0) >= 80).length;
  const blocked = cases.filter((c) => c.lastScore != null && (c.lastScore ?? 0) < 80).length;
  const inProgress = cases.filter((c) => !['closed', 'open'].includes(c.status)).length;
  const totalTests = cases.reduce((s, c) => s + (c.tests?.length ?? 0), 0);

  const metrics = [
    { label: 'Active audits', value: cases.length, hint: 'Memory cases in factory', accent: undefined },
    { label: 'Avg health', value: avgScore ?? '—', suffix: avgScore != null ? '%' : '', hint: 'Across scored cases', accent: undefined },
    { label: 'Ship-ready', value: shipReady, hint: 'Score ≥ 80%', accent: 'emerald' as const },
    { label: 'Gate blocked', value: blocked, hint: 'Needs surgery', accent: 'amber' as const },
    { label: 'In pipeline', value: inProgress, hint: 'Not yet closed', accent: undefined },
    { label: 'Trap tests', value: totalTests, hint: 'Across all audits', accent: 'cyan' as const },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Metric
            accent={m.accent}
            hint={m.hint}
            label={m.label}
            suffix={m.suffix}
            value={String(m.value)}
          />
        </motion.div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix = '',
  hint,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint: string;
  accent?: 'emerald' | 'amber' | 'cyan';
}) {
  const valueColor =
    accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'amber'
        ? 'text-amber-300'
        : accent === 'cyan'
          ? 'text-cyan-300'
          : 'text-white';

  return (
    <div className="ent-metric metric-card-hover">
      <div className="font-hud text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-sig text-3xl font-bold ${valueColor}`}>
        {value}
        {suffix ? <span className="text-lg opacity-70">{suffix}</span> : null}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}