import type { CaseRecord } from '../api/memgateqaApi';
import { beamLabel } from '../lib/beamCategories';

interface ProofScorecardProps {
  caseData: CaseRecord;
}

/** Before/after trap scorecard with category breakdown. */
export function ProofScorecard({ caseData }: ProofScorecardProps) {
  const before = caseData.resultsBefore ?? [];
  const after = caseData.resultsAfter ?? [];
  if (!before.length) return null;

  const scoreBefore = caseData.reports?.[0] as { scoreBefore?: number } | undefined;
  const beforeHealth =
    scoreBefore?.scoreBefore ??
    Math.round(before.reduce((s, r) => s + r.beforeScore, 0) / before.length);
  const afterHealth = caseData.lastScore ?? 0;

  const breakdown = caseData.lastBreakdown;
  const decoys = caseData.tests.filter((t) => t.category === 'decoy');
  const decoyResults = (caseData.resultsAfter?.length ? caseData.resultsAfter : before).filter((r) =>
    decoys.some((d) => d.id === r.testId),
  );
  const decoyPass = decoyResults.filter((r) => r.status === 'pass').length;

  return (
    <section className="proof-scorecard">
      <div className="proof-scorecard-head">
        <p className="font-hud text-[9px] uppercase tracking-widest text-slate-500">Committed proof · results/scorecard.json</p>
        <h3 className="font-sig text-lg font-bold text-white">Trap scorecard</h3>
        <div className="proof-scorecard-arc">
          <span className="proof-score-before">{beforeHealth}%</span>
          <span className="proof-score-arrow">→</span>
          <span className="proof-score-after">{afterHealth}%</span>
          <span className={`proof-score-delta ${afterHealth >= 80 ? 'clear' : 'blocked'}`}>
            {afterHealth >= beforeHealth ? '+' : ''}{afterHealth - beforeHealth} pts
          </span>
        </div>
      </div>
      {breakdown ? (
        <div className="proof-category-strip">
          {(
            [
              ['evidenceGrounding', 'Grounding', '30%'],
              ['freshness', 'Freshness', '20%'],
              ['privacyLeakResistance', 'Privacy', '10%'],
              ['forgetSuccess', 'Forget', '10%'],
            ] as const
          ).map(([key, label, weight]) => (
            <div key={key} className="proof-category-pill">
              <span className="proof-category-label">{label}</span>
              <span className="proof-category-val">{breakdown[key]}%</span>
              <span className="proof-category-weight">{weight}</span>
            </div>
          ))}
        </div>
      ) : null}

      {decoys.length ? (
        <p className="proof-decoy-line">
          Decoys: <strong>{decoyPass}/{decoys.length}</strong> correctly left alone
        </p>
      ) : null}

      <p className="proof-cost-payback text-xs text-slate-500 mt-3">
        <strong className="text-slate-400">Cost payback:</strong> Cognee&apos;s published analysis shows ingestion cost
        amortizes after ~23–26 repeated queries per dataset. WolfPack reference case: ~7 trap recalls per audit cycle —
        payback within one full gate run after initial remember().
      </p>

      <table className="proof-scorecard-table">
        <thead>
          <tr>
            <th>Trap</th>
            <th>Category</th>
            <th>Before</th>
            <th>After</th>
            <th>Δ</th>
          </tr>
        </thead>
        <tbody>
          {before
            .filter((b) => caseData.tests.find((t) => t.id === b.testId)?.category !== 'decoy')
            .map((b) => {
            const test = caseData.tests.find((t) => t.id === b.testId);
            const a = after.find((x) => x.testId === b.testId);
            const wedge = test?.category === 'privacy' || test?.category === 'forget';
            const delta = (a?.beforeScore ?? 0) - b.beforeScore;
            return (
              <tr key={b.testId} className={wedge ? 'proof-row-wedge' : ''}>
                <td className="font-medium text-white">
                  {wedge ? '★ ' : ''}{test?.title ?? b.testId}
                </td>
                <td className="font-hud text-[9px] uppercase text-slate-500">{test ? beamLabel(test.category) : '—'}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>{a ? <StatusBadge status={a.status} /> : <span className="text-slate-600">—</span>}</td>
                <td className="font-hud text-xs text-cyan-300">{a ? `+${delta}` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const pass = status === 'pass' || status === 'fixed';
  return (
    <span className={`proof-status ${pass ? 'pass' : 'fail'}`}>
      {pass ? '✓ PASS' : '✗ FAIL'}
    </span>
  );
}