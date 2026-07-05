import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord, type EvidenceItem, type TestItem, type TestResult } from '../api/memgateqaApi';

interface TrapDepositionBoardProps {
  caseId?: string;
  onPinEvidence?: (evidenceId: string) => void;
}

/** Cynergy deposition twist — witnesses = evidence, contradictions = failed traps, recant = surgery. */
export function TrapDepositionBoard({ caseId = 'case-wolfpack', onPinEvidence }: TrapDepositionBoardProps) {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);

  useEffect(() => {
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
  }, [caseId]);

  if (!caseData) return <div className="case-skeleton h-40" />;

  const fails = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail');
  const evidence = caseData.evidence ?? [];

  return (
    <section className="trap-deposition">
      <header className="trap-deposition-head">
        <p className="font-hud text-[9px] uppercase tracking-wider text-amber-300">Contradiction board</p>
        <h3 className="font-sig text-lg font-bold text-white">Evidence witnesses · open trap conflicts · repair queue</h3>
        <p className="text-xs text-slate-500">
          Pin evidence to the graph, review failed traps, approve forget/improve in surgery.
        </p>
      </header>

      <div className="trap-deposition-grid">
        <div className="trap-deposition-col">
          <p className="trap-deposition-kicker">Witnesses (evidence)</p>
          {evidence.map((ev) => (
            <WitnessCard key={ev.id} ev={ev} onPin={() => onPinEvidence?.(ev.id)} />
          ))}
        </div>

        <div className="trap-deposition-col">
          <p className="trap-deposition-kicker">Contradictions (open traps)</p>
          {fails.length === 0 ? (
            <p className="trap-deposition-clear">No open contradictions — ship clear candidate</p>
          ) : (
            fails.map((r) => (
              <ContradictionCard
                key={r.testId}
                caseId={caseId}
                evidence={evidence}
                result={r}
                test={caseData.tests?.find((t) => t.id === r.testId)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function WitnessCard({ ev, onPin }: { ev: EvidenceItem; onPin: () => void }) {
  return (
    <article className={`trap-witness ${ev.sensitivity}`}>
      <div className="trap-witness-top">
        <span className="trap-witness-badge">{ev.sensitivity}</span>
        <button className="trap-witness-pin" onClick={onPin} type="button">
          Pin → graph
        </button>
      </div>
      <h4 className="trap-witness-title">{ev.title}</h4>
      <p className="trap-witness-body">{ev.body?.slice(0, 140)}…</p>
    </article>
  );
}

function ContradictionCard({
  result,
  test,
  evidence,
  caseId,
}: {
  result: TestResult;
  test?: TestItem;
  evidence: EvidenceItem[];
  caseId: string;
}) {
  const cited = evidence.filter((e) => test?.evidenceIds?.includes(e.id));
  return (
    <article className="trap-contradiction">
      <p className="trap-contradiction-title">{test?.title ?? result.testId}</p>
      <p className="trap-contradiction-q">{test?.question}</p>
      <p className="trap-contradiction-bad">
        <span className="label">Agent said</span> {result.actual?.slice(0, 120) || '—'}
      </p>
      <p className="trap-contradiction-good">
        <span className="label">Expected</span> {test?.expected?.slice(0, 120)}
      </p>
      {cited.length ? (
        <p className="trap-contradiction-cite">
          Cites: {cited.map((c) => c.title).join(' · ')}
        </p>
      ) : null}
      <Link className="trap-contradiction-recant" to={`/cases/${caseId}/surgery`}>
        Recant in surgery →
      </Link>
    </article>
  );
}