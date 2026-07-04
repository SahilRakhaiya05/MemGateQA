import type { CaseRecord } from '../api/memgateqaApi';

interface ProofScorecardProps {
  caseData: CaseRecord;
}

/** Before/after trap table — cognost-style quantified proof. */
export function ProofScorecard({ caseData }: ProofScorecardProps) {
  const before = caseData.resultsBefore ?? [];
  const after = caseData.resultsAfter ?? [];
  if (!before.length) return null;

  const scoreBefore = caseData.reports?.[0] as { scoreBefore?: number } | undefined;
  const beforeHealth =
    scoreBefore?.scoreBefore ??
    Math.round(before.reduce((s, r) => s + r.beforeScore, 0) / before.length);
  const afterHealth = caseData.lastScore ?? 0;

  return (
    <section className="proof-scorecard">
      <div className="proof-scorecard-head">
        <p className="font-hud text-[9px] uppercase tracking-widest text-slate-500">Deploy proof</p>
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
      <table className="proof-scorecard-table">
        <thead>
          <tr>
            <th>Trap</th>
            <th>Category</th>
            <th>Before</th>
            <th>After</th>
          </tr>
        </thead>
        <tbody>
          {before.map((b) => {
            const test = caseData.tests.find((t) => t.id === b.testId);
            const a = after.find((x) => x.testId === b.testId);
            return (
              <tr key={b.testId}>
                <td className="font-medium text-white">{test?.title ?? b.testId}</td>
                <td className="font-hud text-[9px] uppercase text-slate-500">{test?.category}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>{a ? <StatusBadge status={a.status} /> : <span className="text-slate-600">—</span>}</td>
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