import { useEffect, useState } from 'react';
import { api, type LoopLedgerData } from '../api/memgateqaApi';

interface LoopLedgerPanelProps {
  caseId: string;
}

export function LoopLedgerPanel({ caseId }: LoopLedgerPanelProps) {
  const [data, setData] = useState<LoopLedgerData | null>(null);

  useEffect(() => {
    api.loopLedger(caseId).then(setData).catch(() => setData(null));
  }, [caseId]);

  if (!data) return <div className="case-skeleton h-16" />;

  return (
    <section className="loop-ledger-panel">
      <p className="font-hud text-[10px] uppercase tracking-wider text-purple-300">Loop engineering ledger</p>
      <h3 className="font-sig text-base font-bold text-white">STATE + run history</h3>
      <pre className="loop-ledger-md">{data.stateMd}</pre>
      {data.ledger.length > 0 ? (
        <ul className="loop-ledger-list">
          {data.ledger.slice().reverse().map((row, i) => (
            <li key={i} className="loop-ledger-row">
              <span className="loop-ledger-time">{row.t?.slice(11, 19)}</span>
              <span className="loop-ledger-step">{row.stepId ?? row.op ?? 'tick'}</span>
              <span className="loop-ledger-detail">{(row.detail ?? row.message ?? '').slice(0, 80)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No loop ticks yet — run observe → recall → grade in Agent tab.</p>
      )}
    </section>
  );
}