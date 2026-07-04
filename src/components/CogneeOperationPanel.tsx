import { useCallback, useEffect, useState } from 'react';
import { api, type CogneeOpEntry } from '../api/memgateqaApi';

interface CogneeOperationPanelProps {
  caseId: string;
  compact?: boolean;
  collapsible?: boolean;
}

const OP_LABELS: Record<string, string> = {
  remember: 'remember() — evidence indexed',
  recall: 'recall() — trap interrogation',
  improve: 'improve() — human-approved repair',
  forget: 'forget() — private data removed',
  memify: 'memify() — graph enrichment',
  'datasets.list': 'datasets — Cognee Cloud',
};

export function CogneeOperationPanel({ caseId, compact, collapsible }: CogneeOperationPanelProps) {
  const [ops, setOps] = useState<CogneeOpEntry[]>([]);
  const [open, setOpen] = useState(!collapsible);

  const refresh = useCallback(() => {
    api.getOps(caseId).then(setOps).catch(() => setOps([]));
  }, [caseId]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <section className={`cognee-op-panel ${compact ? 'compact' : ''} ${collapsible ? 'collapsible' : ''}`}>
      <div className="cognee-op-head">
        <button
          className="cognee-op-head-toggle"
          onClick={() => (collapsible ? setOpen((v) => !v) : undefined)}
          type="button"
        >
          <div>
            <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Cognee API log</p>
            <h3 className="font-sig text-base font-bold text-white">
              remember → recall → improve → forget
              {ops.length ? <span className="cognee-op-count">{ops.length}</span> : null}
            </h3>
          </div>
          {collapsible ? <span className="cognee-op-chevron">{open ? '−' : '+'}</span> : null}
        </button>
        <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={refresh} type="button">
          Refresh
        </button>
      </div>
      {!open ? null : ops.length === 0 ? (
        <p className="text-sm text-slate-500">
          No Cognee calls yet. Index evidence, run trap tests, then approve repair to populate the log.
        </p>
      ) : (
        <ol className="cognee-op-timeline">
          {ops.slice(0, compact ? 6 : 12).map((op, i) => (
            <li key={`${op.t}-${i}`} className={`cognee-op-row ${op.ok ? 'ok' : 'fail'}`}>
              <span className="cognee-op-mark">{op.ok ? '✓' : '✗'}</span>
              <div className="cognee-op-body">
                <p className="cognee-op-title">{OP_LABELS[op.op] ?? op.op}</p>
                {op.detail ? <p className="cognee-op-detail">{op.detail}</p> : null}
              </div>
              <span className="cognee-op-ms">{op.ms}ms</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}