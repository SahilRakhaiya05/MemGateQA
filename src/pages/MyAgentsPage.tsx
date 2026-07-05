import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type MyAgentSummary } from '../api/memgateqaApi';
import { getUserId } from '../lib/userId';
import { AgentShareQuick } from '../components/AgentShareQuick';
import { SkillScoreRing } from '../components/SkillScoreRing';
import { useToast } from '../components/Toast';

const QUICK_TEMPLATES = [
  {
    id: 'deep_research',
    name: 'Deep Research Agent',
    blurb: '11 evidence · 9 traps · multi-hop graph recall · LUMEN policy research',
  },
  {
    id: 'atlas_research',
    name: 'Atlas Research Copilot',
    blurb: '11 evidence · 9 traps · papers + graph recall · HELIOS lab memory',
  },
  {
    id: 'context_keeper',
    name: 'Mnemosyne Context Keeper',
    blurb: '11 evidence · 9 traps · personal memory · workflows · tutoring',
  },
  {
    id: 'memory_dna',
    name: 'Clinical Memory DNA Officer',
    blurb: '11 evidence · 10 traps · PHI forget · stale protocol repair',
  },
  {
    id: 'wolfpack_gate',
    name: 'WolfPack Memory Gate',
    blurb: '6 evidence · 8 traps · project memory · Cognee lifecycle',
  },
] as const;

type AgentFilter = 'all' | 'clear' | 'audit' | 'shared';

export function MyAgentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<MyAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [openShareId, setOpenShareId] = useState<string | null>(null);
  const [spawning, setSpawning] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .listMyAgents(getUserId())
      .then(setAgents)
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const spawnTemplate = async (templateId: string, defaultName: string) => {
    const name = prompt('Name your agent:', defaultName);
    if (!name?.trim()) return;
    setSpawning(templateId);
    setError('');
    try {
      const res = await api.createAgent({
        agentName: name.trim(),
        templateId,
        ownerId: getUserId(),
        indexMemory: true,
        launch: true,
      });
      toast(`${name.trim()} live — Cognee indexed`, 'success');
      reload();
      navigate(`/cases/${res.case.id}/chat`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSpawning(null);
    }
  };

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
          <p className="text-sm text-slate-500">Cognee memory · recall traps · audit · share</p>
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

      <details className="ent-card p-4 mb-6">
        <summary className="cursor-pointer font-sig text-white">+ Add another agent</summary>
        <p className="mt-2 text-sm text-slate-500">New agent with full Cognee memory — indexed on create.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="ent-template-card text-left"
              disabled={Boolean(spawning)}
              onClick={() => spawnTemplate(t.id, t.name)}
              type="button"
            >
              <span className="font-medium text-white">{t.name}</span>
              <span className="mt-1 block text-xs text-slate-500">{t.blurb}</span>
              <span className="mt-2 block text-[10px] text-cyan-400/80">
                {spawning === t.id ? 'Indexing on Cognee…' : 'Create + index memory'}
              </span>
            </button>
          ))}
        </div>
      </details>

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
          const status = a.sharePath ? 'live' : a.agentStatus;
          return (
            <article key={a.id} className={`agents-card ${ship ? 'ship-clear' : ''}`}>
              <div className="agents-card-main">
                <SkillScoreRing score={a.lastScore} />
                <div className="agents-card-body">
                  <div className="agents-card-head">
                    <h2>{a.agent || a.name}</h2>
                    <span className={`agents-card-badge ${a.sharePath ? 'live' : status}`}>{status}</span>
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