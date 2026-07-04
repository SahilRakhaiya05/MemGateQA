import { useEffect, useState } from 'react';
import { api } from '../api/memgateqaApi';

interface MemoryLanePanelProps {
  caseId: string;
}

export function MemoryLanePanel({ caseId }: MemoryLanePanelProps) {
  const [profile, setProfile] = useState<{
    profile: { static: string[]; dynamic: string[] };
    documentCount: number;
    activeFacts: number;
    containerTag: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<{ type: string; text: string; score: number; source: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.memoryProfile(caseId).then(setProfile).catch(() => setProfile(null));
  }, [caseId]);

  const search = async () => {
    if (!query.trim() || busy) return;
    setBusy(true);
    try {
      const res = await api.memorySearch(caseId, query.trim());
      setHits(res.results);
    } finally {
      setBusy(false);
    }
  };

  if (!profile) return <div className="case-skeleton h-20" />;

  return (
    <section className="memory-lane-panel">
      <div className="memory-lane-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">MemGate Memory Engine</p>
          <h3 className="font-sig text-lg font-bold text-white">Hybrid lane · local facts + Cognee graph</h3>
          <p className="mt-1 text-xs text-slate-500">
            {profile.containerTag} · {profile.documentCount} docs · {profile.activeFacts} facts
          </p>
        </div>
      </div>

      <div className="memory-lane-columns">
        <div className="memory-lane-col">
          <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Static profile</p>
          <ul className="memory-lane-list">
            {(profile.profile.static.length ? profile.profile.static : ['Index evidence to extract facts']).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="memory-lane-col">
          <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Dynamic context</p>
          <ul className="memory-lane-list">
            {(profile.profile.dynamic.length ? profile.profile.dynamic : ['Run loop ticks to populate']).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      <form
        className="memory-lane-search"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input
          className="ent-input"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hybrid recall query…"
          value={query}
        />
        <button className="ent-btn ent-btn-primary ent-btn-sm" disabled={busy} type="submit">
          recall()
        </button>
      </form>

      {hits.length > 0 ? (
        <ul className="memory-lane-hits">
          {hits.map((h, i) => (
            <li key={i} className="memory-lane-hit">
              <span className="memory-lane-hit-badge">{h.source}</span>
              <span className="memory-lane-hit-text">{h.text.slice(0, 220)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}