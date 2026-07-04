import { MemoryLifecyclePills } from './MemoryLifecyclePills';
import { useCogneeBridge } from '../hooks/useCogneeBridge';

interface CogneeBridgeChipProps {
  dataset?: string;
  indexed?: number;
  pending?: number;
  activeOps?: string[];
  lastOp?: string;
  embedded?: boolean;
}

/** Single Cognee status chip — bridge health + lifecycle (no duplicate pills elsewhere). */
export function CogneeBridgeChip({
  dataset,
  indexed = 0,
  pending = 0,
  activeOps = [],
  lastOp,
  embedded = true,
}: CogneeBridgeChipProps) {
  const { health } = useCogneeBridge();
  const live = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';
  const ds = dataset ?? health?.dataset;

  return (
    <div className={`cognee-bridge-chip ${embedded ? 'embedded' : ''}`}>
      <div className="cognee-bridge-chip-main">
        <div className="cognee-bridge-chip-row">
          <span className={`cognee-bridge-dot ${live ? 'live' : mode === 'mock' ? 'mock' : 'offline'}`} />
          <span className="cognee-bridge-label">
            {live ? 'Cognee live' : mode === 'mock' ? 'Mock bridge' : 'Bridge offline'}
          </span>
          {ds ? <code className="cognee-bridge-dataset">{ds}</code> : null}
          {pending > 0 ? (
            <span className="cognee-bridge-meta">{pending} queued</span>
          ) : indexed > 0 ? (
            <span className="cognee-bridge-meta">{indexed} indexed</span>
          ) : null}
        </div>
        <MemoryLifecyclePills
          active={activeOps}
          compact
          fnStyle
          lastOp={lastOp}
          showHeading={false}
        />
      </div>
    </div>
  );
}