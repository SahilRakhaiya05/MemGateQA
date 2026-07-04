import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type CogneeOpEntry } from '../../api/memgateqaApi';
import { useCogneeBridge } from '../../hooks/useCogneeBridge';

interface CogneeLivePanelProps {
  caseId?: string;
  dataset?: string;
  indexed?: number;
  pending?: number;
  beltFast?: boolean;
}

const OP_COLORS: Record<string, string> = {
  remember: '#22ff88',
  recall: '#00f5ff',
  improve: '#F5A623',
  forget: '#e0533f',
};

export function CogneeLivePanel({
  caseId,
  dataset,
  indexed = 0,
  pending = 0,
  beltFast = false,
}: CogneeLivePanelProps) {
  const { health } = useCogneeBridge();
  const [ops, setOps] = useState<CogneeOpEntry[]>([]);
  const live = Boolean(health?.cognee_reachable);
  const mode = health?.mode ?? 'offline';
  const ds = dataset ?? health?.dataset ?? '—';

  useEffect(() => {
    if (!caseId) return;
    const load = () => api.getOps(caseId).then(setOps).catch(() => setOps([]));
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [caseId]);

  const recent = ops.slice(-5).reverse();
  const lastOp = ops[ops.length - 1];

  return (
    <div className="cognee-live-panel">
      <div className="cognee-live-panel-head">
        <span className={`cognee-bridge-dot ${live ? 'live' : mode === 'mock' ? 'mock' : 'offline'}`} />
        <span className="cognee-live-title">Cognee lane</span>
        <code className="cognee-live-dataset">{ds}</code>
        {beltFast ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            className="cognee-live-indexing"
            transition={{ duration: 0.7, repeat: Infinity }}
          >
            INDEXING
          </motion.span>
        ) : null}
      </div>

      <div className="cognee-live-stats">
        <span>{indexed} indexed</span>
        <span>{pending > 0 ? `${pending} queued` : 'queue clear'}</span>
        <span>{ops.length} API calls</span>
      </div>

      <div className="cognee-live-feed">
        <AnimatePresence mode="popLayout">
          {recent.length === 0 ? (
            <p className="cognee-live-empty">
              {caseId ? 'No Cognee calls yet — run INDEX or interrogate.' : 'Open a case for live receipts.'}
            </p>
          ) : (
            recent.map((op, i) => (
              <motion.div
                key={`${op.op}-${op.t ?? i}-${i}`}
                animate={{ opacity: 1, x: 0 }}
                className={`cognee-live-row ${op.ok ? 'ok' : 'fail'}`}
                initial={{ opacity: 0, x: -8 }}
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

      {lastOp ? (
        <p className="cognee-live-tail">
          Last: <strong>{lastOp.op}()</strong> → {lastOp.dataset} · {lastOp.ms}ms
        </p>
      ) : null}
    </div>
  );
}