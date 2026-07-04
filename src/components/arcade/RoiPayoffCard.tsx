import type { CaseRecord } from '../../api/memgateqaApi';

interface RoiPayoffCardProps {
  cases: CaseRecord[];
}

export function RoiPayoffCard({ cases }: RoiPayoffCardProps) {
  const tested = cases.filter((c) => (c.resultsBefore?.length ?? 0) > 0).length;
  const repaired = cases.filter((c) => (c.resultsAfter?.length ?? 0) > 0).length;
  const shipped = cases.filter((c) => (c.lastScore ?? 0) >= 80).length;
  const totalTests = cases.reduce((s, c) => s + (c.tests?.length ?? 0), 0);
  const trapsCleared = cases.reduce(
    (s, c) => s + (c.resultsAfter ?? c.resultsBefore ?? []).filter((r) => r.status === 'pass').length,
    0,
  );

  return (
    <div className="roi-payoff-card">
      <p className="roi-payoff-head font-hud text-[9px] uppercase tracking-widest text-emerald-400">
        QA payoff · enterprise ROI
      </p>
      <h3 className="font-sig text-lg font-bold text-white">Memory gate savings</h3>
      <div className="roi-payoff-grid">
        <PayoffStat label="Audits run" value={String(cases.length)} />
        <PayoffStat label="Trap tests" value={String(totalTests)} />
        <PayoffStat label="Interrogated" value={String(tested)} />
        <PayoffStat label="Repaired" value={String(repaired)} />
        <PayoffStat accent="green" label="Ship cleared" value={String(shipped)} />
        <PayoffStat accent="cyan" label="Tests passed" value={String(trapsCleared)} />
      </div>
      <p className="roi-payoff-foot text-xs text-slate-500">
        Every cleared gate = one less production memory incident. Block deploy until Health ≥ 80%.
      </p>
    </div>
  );
}

function PayoffStat({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'cyan' }) {
  const color = accent === 'green' ? 'text-cleared-green' : accent === 'cyan' ? 'text-neon-cyan' : 'text-white';
  return (
    <div className="roi-payoff-stat">
      <span className={`font-sig text-2xl font-bold ${color}`}>{value}</span>
      <span className="font-hud text-[8px] uppercase text-slate-500">{label}</span>
    </div>
  );
}