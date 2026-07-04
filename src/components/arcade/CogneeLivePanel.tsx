import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type CogneeOpEntry } from '../../api/memgateqaApi';

interface CogneeLivePanelProps {
  caseId?: string;
  beltFast?: boolean;
}

const OP_COLORS: Record<string, string> = {
  remember: '#22ff88',
  recall: '#00f5ff',
  improve: '#F5A623',
  forget: '#e0533f',
};

/** API receipts only — bridge/dataset/stats live in CogneeBridgeChip above. */
export function CogneeLivePanel({ caseId, beltFast = false }: CogneeLivePanelProps) {
  const [ops, setOps] = useState<CogneeOpEntry[]>([]);

  useEffect(() => {
    if (!caseId) return;
    const load = () => api.getOps(caseId).then(setOps).catch(() => setOps([]));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [caseId]);

  const recent = ops.slice(-4).reverse();

  return (
    <div className="cognee-live-panel">
      <p className="cognee-live-title font-hud text-[9px] uppercase tracking-wider text-slate-500">
        API receipts
        {beltFast ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            className="cognee-live-indexing ml-2"
            transition={{ duration: 0.7, repeat: Infinity }}
          >
            · indexing
          </motion.span>
        ) : null}
      </p>

      <div className="cognee-live-feed">
        <AnimatePresence mode="popLayout">
          {recent.length === 0 ? (
            <p className="cognee-live-empty">No calls yet — INDEX or GO.</p>
          ) : (
            recent.map((op, i) => (
              <motion.div
                key={`${op.op}-${op.t ?? i}-${i}`}
                animate={{ opacity: 1, x: 0 }}
                className={`cognee-live-row ${op.ok ? 'ok' : 'fail'}`}
                initial={{ opacity: 0, x: -6 }}
                layout
              >
                <span className="cognee-live-op" style={{ color: OP_COLORS[op.op] ?? '#94a3b8' }}>
                  {op.op}()
                </span>
                <span className="cognee-live-ms">{op.ms}ms</span>
                <span className="cognee-live-status">{op.ok ? '✓' : '✗'}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}