import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type MyAgentSummary } from '../api/memgateqaApi';
import { getUserId } from '../lib/userId';
import { AgentShareQuick } from '../components/AgentShareQuick';
import { SkillScoreRing } from '../components/SkillScoreRing';

type AgentFilter = 'all' | 'clear' | 'audit' | 'shared';

export function MyAgentsPage() {
  const [agents, setAgents] = useState<MyAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [openShareId, setOpenShareId] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .listMyAgents(getUserId())
      .then(setAgents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const stats = useMemo(() => {
    const clear = agents.filter((a) => (a.lastScore ?? 0) >= 80).length;
    const audit = agents.filter((a) => (a.openFailures ?? 0) > 0 || (a.lastScore ?? 0) < 80).length;
    const shared = agents.filter((a) => Boolean(a.sharePath)).length;
    return { total: agents.length, clear, audit, shared };
  }, [agents]);

  const filtered = useMemo(() => {
    if (filter === 'clear') return agents.filter((a) => (a.lastScore ?? 0) >= 80);
    if (filter === 'audit') return agents.filter((a) => (a.openFailures ?? 0) > 0 || (a.lastScore ?? 0) < 80);
    if (filter === 'shared') return agents.filter((a) => Boolean(a.sharePath));
    return agents;
  }, [agents, filter]);

  const filters: { id: AgentFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'clear', label: 'Ship clear', count: stats.clear },
    { id: 'audit', label: 'Needs audit', count: stats.audit },
    { id: 'shared', label: 'Shared', count: stats.shared },
  ];

  return (
    <div className="agents-page">
      <header className="agents-page-hero">
        <div>
          <h1 className="font-sig text-2xl font-bold text-white">My agents</h1>
          <p className="text-sm text-slate-500">Build · audit · share — one grid, every agent</p>
        </div>
        <Link className="ent-btn ent-btn-primary" to="/agents/create">
          + Create agent
        </Link>
      </header>

      <div className="agents-stats-bar">
        <div className="agents-stat">
          <strong>{stats.total}</strong>
          <span>agents</span>
        </div>
        <div className="agents-stat clear">
          <strong>{stats.clear}</strong>
          <span>ship clear</span>
        </div>
        <div className="agents-stat warn">
          <strong>{stats.audit}</strong>
          <span>need audit</span>
        </div>
        <div className="agents-stat">
          <strong>{stats.shared}</strong>
          <span>shared</span>
        </div>
      </div>

      <div className="agents-filter-bar" role="tablist" aria-label="Filter agents">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`agents-filter-chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
            type="button"
          >
            {f.label}
            <span className="agents-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="case-skeleton h-32" /> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {!loading && !error && filtered.length === 0 ? (
        <div className="ent-card p-8 text-center">
          <p className="text-slate-400">No agents in this view.</p>
          <Link className="vegas-neon-btn mt-4 inline-flex" to="/agents/create">
            Build in chat
          </Link>
        </div>
      ) : null}

      <div className="agents-card-grid">
        {filtered.map((a) => {
          const ship = (a.lastScore ?? 0) >= 80;
          return (
            <article key={a.id} className={`agents-card ${ship ? 'ship-clear' : ''}`}>
              <div className="agents-card-main">
                <SkillScoreRing score={a.lastScore} />
                <div className="agents-card-body">
                  <div className="agents-card-head">
                    <h2>{a.agent || a.name}</h2>
                    <span className={`agents-card-badge ${a.sharePath ? 'live' : a.agentStatus}`}>
                      {a.sharePath ? 'live' : a.agentStatus}
                    </span>
                  </div>
                  <div className="agents-card-metrics">
                    <span>{a.evidenceCount ?? 0} facts</span>
                    <span>{a.trapCount ?? 0} traps</span>
                    <span className={(a.openFailures ?? 0) > 0 ? 'warn' : 'ok'}>
                      {(a.openFailures ?? 0) > 0 ? `${a.openFailures} open` : ship ? 'Clear' : 'Run audit'}
                    </span>
                  </div>
                  {a.dataset ? <code className="agents-card-dataset">{a.dataset}</code> : null}
                </div>
              </div>

              <div className="agents-card-actions">
                <Link className="ent-btn ent-btn-primary ent-btn-sm" to={`/cases/${a.id}`}>
                  Workspace
                </Link>
                <Link className="ent-btn ent-btn-secondary ent-btn-sm" to="/studio">
                  Belt
                </Link>
                <Link className="ent-btn ent-btn-ghost ent-btn-sm" to={`/cases/${a.id}/chat`}>
                  Chat
                </Link>
                <button
                  className="ent-btn ent-btn-ghost ent-btn-sm"
                  onClick={() => setOpenShareId(openShareId === a.id ? null : a.id)}
                  type="button"
                >
                  {openShareId === a.id ? 'Close' : 'Share'}
                </button>
              </div>

              {openShareId === a.id ? (
                <div className="agents-card-share">
                  <AgentShareQuick agent={a} onUpdated={reload} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}