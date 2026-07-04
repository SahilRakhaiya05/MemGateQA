import { useEffect, useState } from 'react';

const MESSAGES = [
  'remember() indexing evidence packets…',
  'recall() trap suite running…',
  'Gate threshold: Health ≥ 80%',
  'improve() surgery awaiting approval…',
  'forget() purge queue ready…',
  'Regression rerun scheduled post-repair…',
  'Certificate export on ship clear…',
  'Privacy trap: refuse private tokens…',
  'Stale trap: latest decision wins…',
  'Contradiction trap: consistency check…',
];

export function LiveOpsFeed() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="live-ops-feed">
      <span className="live-ops-feed-label font-hud">Live ops</span>
      <span className="live-ops-feed-dot" />
      <span className="live-ops-feed-text" key={idx}>{MESSAGES[idx]}</span>
    </div>
  );
}