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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Active audits" value={String(cases.length)} hint="Memory cases in factory" />
      <Metric label="Avg health" value={avgScore != null ? `${avgScore}%` : '—'} hint="Across scored cases" />
      <Metric label="Ship-ready" value={String(shipReady)} hint="Score ≥ 80%" accent="emerald" />
      <Metric label="Gate blocked" value={String(blocked)} hint="Needs surgery" accent="amber" />
      <Metric label="In pipeline" value={String(inProgress)} hint="Not yet closed" className="sm:col-span-2 lg:col-span-1" />
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
  className = '',
}: {
  label: string;
  value: string;
  hint: string;
  accent?: 'emerald' | 'amber';
  className?: string;
}) {
  const valueColor =
    accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-300' : 'text-white';
  return (
    <div className={`ent-metric ${className}`}>
      <div className="font-hud text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-sig text-3xl font-bold ${valueColor}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}