import { motion } from 'framer-motion';
import type { BridgeHealth } from '../api/memgateqaApi';

interface LiveStatusBarProps {
  health: BridgeHealth | null;
}

const API_OPS = ['remember', 'recall', 'improve', 'forget', 'cognify'] as const;

export function LiveStatusBar({ health }: LiveStatusBarProps) {
  const live = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';

  return (
    <div className="live-status-bar">
      <div className="live-status-pulse">
        <motion.span
          animate={live ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
          className={`live-dot ${live ? 'live' : mode === 'mock' ? 'mock' : 'offline'}`}
          transition={{ duration: 2, repeat: live ? Infinity : 0 }}
        />
        <span className="font-hud text-[10px] uppercase tracking-wider">
          {live ? 'Bridge connected' : mode === 'mock' ? 'Mock bridge' : 'Bridge offline'}
        </span>
      </div>

      <div className="live-status-apis">
        {API_OPS.map((op) => (
          <span key={op} className={`live-api-pill ${live || mode === 'mock' ? 'ready' : 'dim'}`}>
            <code>{op}()</code>
          </span>
        ))}
      </div>

      <div className="live-status-meta">
        {health?.case_count != null ? (
          <span className="live-meta-item">
            <strong>{health.case_count}</strong> audits
          </span>
        ) : null}
        <span className="live-meta-item">
          Gate threshold <strong>≥80%</strong>
        </span>
        <span className="live-meta-item hidden sm:inline">
          Press <kbd className="cmd-kbd">`</kbd> for API receipts
        </span>
      </div>
    </div>
  );
}