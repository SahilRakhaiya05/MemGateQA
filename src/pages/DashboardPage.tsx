import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ReferenceCaseCard } from '../components/ReferenceCaseCard';
import { LifecycleRunner } from '../components/LifecycleRunner';
import { ShipGateHero } from '../components/ShipGateHero';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { getGatePhase, gatePhaseLabel } from '../lib/gateStatus';
import { api, type CaseRecord } from '../api/memgateqaApi';

const statusColor: Record<string, string> = {
  open: 'text-slate-400',
  intake: 'text-cyan-300',
  tested: 'text-amber-300',
  surgery: 'text-orange-300',
  repaired: 'text-emerald-300',
  closed: 'text-emerald-400',
};

export function DashboardPage() {
  const { health } = useCogneeBridge();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'blocked'>('all');

  useEffect(() => {
    api
      .listCases()
      .then(setCases)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete audit "${name}"?`)) return;
    await api.deleteCase(id);
    setCases((c) => c.filter((x) => x.id !== id));
  };

  const wolfpack = cases.find((c) => c.id === 'case-wolfpack');
  const userCases = cases.filter((c) => c.id !== 'case-wolfpack');

  const filtered = userCases.filter((c) => {
    const hasResults = (c.resultsBefore?.length ?? 0) > 0;
    const phase = getGatePhase(c.lastScore, hasResults);
    if (filter === 'ready') return phase === 'clear';
    if (filter === 'blocked') return phase === 'blocked';
    return true;
  });

  const readyCount = cases.filter((c) => {
    const hasResults = (c.resultsBefore?.length ?? 0) > 0;
    return getGatePhase(c.lastScore, hasResults) === 'clear';
  }).length;

  return (
    <div className="dashboard-page space-y-6">
      <ShipGateHero auditCount={cases.length} health={health} readyCount={readyCount} />

      {error ? (
        <div className="error-banner">
          <p className="font-bold text-red-200">Bridge not reachable</p>
          <p className="mt-1 text-sm text-red-200/80">
            Run <code className="font-hud">.\start.ps1</code> or <code className="font-hud">npm run dev:all</code>
          </p>
          <p className="mt-2 font-hud text-xs opacity-80">{error}</p>
        </div>
      ) : null}

      <section className="dashboard-demo-section ent-card p-5">
        <div className="dashboard-demo-head">
          <div>
            <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Start here</p>
            <h2 className="font-sig text-xl font-bold text-white">WolfPack reference audit</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              One-click demo of the full Cognee lifecycle — remember, recall traps, repair, certificate.
            </p>
          </div>
          <Link className="ent-btn ent-btn-primary" to="/cases/case-wolfpack">
            Open WolfPack
          </Link>
        </div>
        <div className="mt-4">
          <LifecycleRunner />
        </div>
      </section>

      <section className="dashboard-audits-section">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-sig text-lg font-bold text-white">Your audits</h2>
            <p className="mt-1 text-sm text-slate-500">Evidence → remember → recall → repair → proof</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="ent-btn ent-btn-secondary ent-btn-sm" to="/cases/new">
              + New audit
            </Link>
            {(['all', 'ready', 'blocked'] as const).map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                type="button"
              >
                {f === 'all' ? 'All' : f === 'ready' ? 'Ship clear' : 'Blocked'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="case-skeleton-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="case-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ent-empty">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-slate-400">
              {filter === 'all'
                ? 'No audits yet. Run WolfPack above or create a new audit.'
                : `No ${filter} audits found.`}
            </p>
            <Link className="ent-btn ent-btn-primary mt-4 inline-block" to="/cases/new">
              Create audit
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((c, i) => {
              const hasResults = (c.resultsBefore?.length ?? 0) > 0;
              const phase = getGatePhase(c.lastScore, hasResults);
              const progress = c.lastScore ?? 0;
              return (
                <motion.div
                  key={c.id}
                  animate={{ opacity: 1, y: 0 }}
                  className="ent-case-row case-row-enhanced"
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {c.lastScore != null ? <div className="case-row-progress" style={{ width: `${progress}%` }} /> : null}
                  <div className="relative flex flex-1 flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link className="font-sig text-lg font-bold text-white hover:text-cyan-200" to={`/cases/${c.id}`}>
                          {c.name}
                        </Link>
                        {phase !== 'pending' ? (
                          <span className={`ship-pill ${phase === 'clear' ? 'ready' : 'blocked'}`}>
                            {gatePhaseLabel(phase)} · {c.lastScore}%
                          </span>
                        ) : (
                          <span className="ship-pill pending">Not tested</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-400">{c.description || c.agent}</p>
                      <div className="mt-2 flex flex-wrap gap-3 font-hud text-[10px] uppercase tracking-wider text-slate-500">
                        <span className={statusColor[c.status] ?? 'text-slate-400'}>{c.status}</span>
                        <span>{c.evidence?.length ?? 0} evidence</span>
                        <span>{c.tests?.length ?? 0} tests</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex gap-2">
                    <Link className="ent-btn ent-btn-primary ent-btn-sm" to={`/cases/${c.id}`}>
                      Open
                    </Link>
                    <button
                      className="ent-btn ent-btn-ghost ent-btn-sm"
                      onClick={() => handleDelete(c.id, c.name)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {wolfpack && !userCases.length ? <ReferenceCaseCard reference={wolfpack} /> : null}
    </div>
  );
}