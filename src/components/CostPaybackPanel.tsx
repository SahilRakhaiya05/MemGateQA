import { useEffect, useState } from 'react';
import { api, type CogneeOpEntry } from '../api/memgateqaApi';

interface CostPaybackPanelProps {
  caseId: string;
}

export function CostPaybackPanel({ caseId }: CostPaybackPanelProps) {
  const [ops, setOps] = useState<CogneeOpEntry[]>([]);

  useEffect(() => {
    api.getOps(caseId).then(setOps).catch(() => setOps([]));
    const t = setInterval(() => {
      api.getOps(caseId).then(setOps).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [caseId]);

  const remember = ops.filter((o) => o.op === 'remember').length;
  const recall = ops.filter((o) => o.op.startsWith('recall')).length;
  const improve = ops.filter((o) => o.op.startsWith('improve')).length;
  const forget = ops.filter((o) => o.op === 'forget').length;
  const memify = ops.filter((o) => o.op === 'memify' || o.op === 'cognify').length;
  const totalMs = ops.reduce((s, o) => s + o.ms, 0);

  if (!ops.length) return null;

  const paybackNote =
    recall >= 23
      ? 'Ingestion cost likely amortized (23+ recalls per Cognee published analysis)'
      : `${Math.max(0, 23 - recall)} more recall() calls to hit published payback threshold`;

  return (
    <section className="ent-card p-4 cost-payback-panel">
      <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Live Cognee op log</p>
      <h3 className="font-sig text-lg font-bold text-white">Cost payback signal</h3>
      <div className="mt-3 flex flex-wrap gap-3">
        <OpPill count={remember} label="remember()" />
        <OpPill count={recall} label="recall()" />
        <OpPill count={improve} label="improve()" />
        <OpPill count={memify} label="memify()" />
        <OpPill count={forget} label="forget()" />
        <span className="font-hud text-[10px] text-slate-500 self-center">{Math.round(totalMs)}ms total logged</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{paybackNote}</p>
    </section>
  );
}

function OpPill({ label, count }: { label: string; count: number }) {
  return (
    <span className="cost-op-pill">
      <span className="cost-op-count">{count}</span>
      <span className="cost-op-label">{label}</span>
    </span>
  );
}