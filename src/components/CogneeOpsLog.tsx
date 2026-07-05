import { useEffect, useState } from 'react';
import { api, type CogneeOpEntry } from '../api/memgateqaApi';

interface CogneeOpsLogProps {
  caseId: string;
  open?: boolean;
  onToggle?: () => void;
}

export function CogneeOpsLog({ caseId, open = false, onToggle }: CogneeOpsLogProps) {
  const [ops, setOps] = useState<CogneeOpEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    api.getOps(caseId).then(setOps).catch(() => setOps([]));
    const t = setInterval(() => api.getOps(caseId).then(setOps).catch(() => {}), 3000);
    return () => clearInterval(t);
  }, [caseId, open]);

  if (!open) {
    return (
      <button
        className="cognee-receipts-trigger fixed bottom-4 right-4 z-50 rounded-xl border border-cyan-400/30 bg-panel/95 px-4 py-2 font-hud text-[10px] uppercase tracking-wider text-cyan-200 shadow-glow backdrop-blur hover:bg-cyan-400/10"
        onClick={onToggle}
        type="button"
      >
        ` Cognee Receipts
      </button>
    );
  }

  return (
    <div className="cognee-receipts-drawer fixed bottom-4 right-4 z-50 w-[min(420px,92vw)] rounded-2xl border border-cyan-400/25 bg-panel/95 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-hud text-[10px] uppercase tracking-widest text-cyan-300">Cognee API Receipts</span>
        <button className="text-xs text-slate-400 hover:text-white" onClick={onToggle} type="button">
          Close
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-3 font-hud text-[11px]">
        {ops.length === 0 ? (
          <p className="text-slate-500">No Cognee calls yet. Run remember or interrogate.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500">
                <th className="pb-2">Op</th>
                <th className="pb-2">ms</th>
                <th className="pb-2">OK</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op, i) => (
                <tr key={`${op.t}-${i}`} className="border-t border-white/5 text-slate-300">
                  <td className="py-1.5 text-cyan-200">{op.op}</td>
                  <td className="py-1.5">{op.ms}</td>
                  <td className={`py-1.5 ${op.ok ? 'text-emerald-400' : 'text-red-400'}`}>{op.ok ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
