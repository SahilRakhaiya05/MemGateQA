import { useCogneeBridge } from '../hooks/useCogneeBridge';

interface CogneeBridgeChipProps {
  dataset?: string;
  indexed?: number;
  pending?: number;
}

export function CogneeBridgeChip({ dataset, indexed = 0, pending = 0 }: CogneeBridgeChipProps) {
  const { health } = useCogneeBridge();
  const live = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';

  return (
    <div className="cognee-bridge-chip">
      <div className="cognee-bridge-chip-row">
        <span className={`cognee-bridge-dot ${live ? 'live' : mode === 'mock' ? 'mock' : 'offline'}`} />
        <span className="cognee-bridge-label">
          {live ? 'Cognee live' : mode === 'mock' ? 'Mock bridge' : 'Bridge offline'}
        </span>
        {dataset ? (
          <code className="cognee-bridge-dataset">{dataset}</code>
        ) : health?.dataset ? (
          <code className="cognee-bridge-dataset">{health.dataset}</code>
        ) : null}
      </div>
      <div className="cognee-bridge-ops">
        <span className="cognee-op-pill ready">remember()</span>
        <span className="cognee-op-pill ready">recall()</span>
        <span className="cognee-op-pill ready">improve()</span>
        <span className="cognee-op-pill ready">forget()</span>
        {pending > 0 ? (
          <span className="cognee-bridge-meta">{pending} queued</span>
        ) : indexed > 0 ? (
          <span className="cognee-bridge-meta">{indexed} indexed</span>
        ) : null}
      </div>
    </div>
  );
}