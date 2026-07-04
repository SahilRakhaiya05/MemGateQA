import { useCogneeBridge } from '../hooks/useCogneeBridge';

export function HeaderCognee() {
  const { health } = useCogneeBridge();
  const live = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';

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
      <span className={`header-cognee-status ${live ? 'live' : mode === 'mock' ? 'mock' : 'off'}`}>
        {live ? 'Cloud live' : mode === 'mock' ? 'Mock mode' : 'Offline'}
      </span>
    </div>
  );
}