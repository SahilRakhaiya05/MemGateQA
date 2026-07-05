import type { CaseRecord } from '../api/memgateqaApi';

interface DecoyScorecardProps {
  caseData: CaseRecord;
}

export function DecoyScorecard({ caseData }: DecoyScorecardProps) {
  const decoys = caseData.tests.filter((t) => t.category === 'decoy');
  const results = caseData.resultsAfter?.length ? caseData.resultsAfter : caseData.resultsBefore ?? [];
  if (!decoys.length || !results.length) return null;

  const rows = decoys.map((test) => {
    const r = results.find((x) => x.testId === test.id);
    const ok = r?.status === 'pass';
    return { test, ok, reason: r?.reason };
  });
  const passed = rows.filter((r) => r.ok).length;

  return (
    <section className="decoy-scorecard">
      <div className="decoy-scorecard-head">
        <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">False-positive check</p>
        <h3 className="font-sig text-lg font-bold text-white">
          {passed}/{decoys.length} decoys correctly left alone
        </h3>
        <p className="text-sm text-slate-400">Facts that look risky but are fine — gate must not false-positive.</p>
      </div>
      <ul className="decoy-scorecard-list">
        {rows.map(({ test, ok, reason }) => (
          <li key={test.id} className={`decoy-row ${ok ? 'ok' : 'bad'}`}>
            <span>{ok ? '✓' : '✗'}</span>
            <div>
              <p className="font-medium text-white">{test.title}</p>
              <p className="text-xs text-slate-500">{test.trap ?? test.expected}</p>
              {reason ? <p className="text-xs text-slate-400">{reason}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}