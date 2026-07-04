import { useEffect, useState } from 'react';
import { useCogneeBridge } from '../hooks/useCogneeBridge';

const HINTS = [
  'Gate threshold: Memory Health ≥ 80%',
  'Trap suite covers stale, contradiction, privacy, forget…',
  'Press ` to open Cognee API receipts',
  'INDEX → remember() · GO → recall() · Repair → improve()',
];

export function LiveOpsFeed() {
  const { health } = useCogneeBridge();
  const [idx, setIdx] = useState(0);
  const live = health?.cognee_reachable;
  const mode = health?.mode ?? 'offline';

  const statusLine = live
    ? `Cognee live · dataset ${health?.dataset ?? 'ready'}`
    : mode === 'mock'
      ? 'Mock bridge · run npm run dev:all for live Cognee'
      : 'Bridge offline · start cognee_bridge.py';

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HINTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="live-ops-feed">
      <span className="live-ops-feed-label font-hud">Live ops</span>
      <span className={`live-ops-feed-dot ${live ? 'live' : mode === 'mock' ? 'mock' : ''}`} />
      <span className="live-ops-feed-status">{statusLine}</span>
      <span className="live-ops-feed-divider">·</span>
      <span className="live-ops-feed-text" key={idx}>{HINTS[idx]}</span>
    </div>
  );
}