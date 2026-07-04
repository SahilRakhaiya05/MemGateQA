import { motion } from 'framer-motion';
import type { BridgeHealth } from '../api/memgateqaApi';
import { MemoryLifecyclePills } from './MemoryLifecyclePills';

interface LiveStatusBarProps {
  health: BridgeHealth | null;
}

export function LiveStatusBar({ health }: LiveStatusBarProps) {
  const live = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';
  const ready = live || mode === 'mock';

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

      <MemoryLifecyclePills
        active={ready ? ['remember', 'recall', 'improve', 'forget'] : []}
        compact
        fnStyle
        showHeading={false}
      />

      <div className="live-status-meta">
        {health?.case_count != null ? (
          <span className="live-meta-item">
            <strong>{health.case_count}</strong> audits
          </span>
        ) : null}
        <span className="live-meta-item">
          Gate <strong>≥80%</strong>
        </span>
        <span className="live-meta-item hidden md:inline">
          <kbd className="cmd-kbd">`</kbd> receipts
        </span>
      </div>
    </div>
  );
}