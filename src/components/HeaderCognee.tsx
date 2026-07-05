import { useCogneeBridge } from '../hooks/useCogneeBridge';

export function HeaderCognee() {
  const { health } = useCogneeBridge();
  const live = health?.cognee_reachable;
  const bridgeUp = health?.ok;

  const label = live ? 'Cognee live' : bridgeUp ? 'Bridge ready' : 'Set up';
  const statusClass = live ? 'live' : bridgeUp ? 'ready' : 'off';

  return (
    <div className="header-cognee">
      <a
        className="header-cognee-link"
        href="https://docs.cognee.ai/python-api"
        rel="noopener noreferrer"
        target="_blank"
        title="Cognee Python API"
      >
        <span className="header-cognee-dot" />
        <span>Cognee</span>
      </a>
      <span className={`header-cognee-status ${statusClass}`}>{label}</span>
    </div>
  );
}