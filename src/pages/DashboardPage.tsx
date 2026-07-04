import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ReferenceCaseCard } from '../components/ReferenceCaseCard';
import { GatePulseStrip } from '../components/GatePulseStrip';
import { CogneeProductFlow } from '../components/CogneeProductFlow';
import { LifecycleRunner } from '../components/LifecycleRunner';
import { ShipGateCapabilities } from '../components/ShipGateCapabilities';
import { ShipGateHero } from '../components/ShipGateHero';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { api, type CaseRecord } from '../api/memgateqaApi';

const statusColor: Record<string, string> = {
  open: 'text-slate-400',
  intake: 'text-cyan-300',
  tested: 'text-amber-300',
  surgery: 'text-orange-300',
  repaired: 'text-emerald-300',
  closed: 'text-emerald-400',
};

const statusIcon: Record<string, string> = {
  open: '📂',
  intake: '📥',
  tested: '🔍',
  surgery: '🔧',
  repaired: '✅',
  closed: '🏁',
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
    if (filter === 'ready') return (c.lastScore ?? 0) >= 80;
    if (filter === 'blocked') return c.lastScore != null && (c.lastScore ?? 0) < 80;
    return true;
  });

  const readyCount = cases.filter((c) => (c.lastScore ?? 0) >= 80).length;

  return (
    <div className="dashboard-page space-y-8">
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

      <GatePulseStrip cases={cases} />

      <ShipGateCapabilities />

      <div className="ent-card p-6 mb-4">
        <CogneeProductFlow />
      </div>

      <div className="ent-card p-5 mb-4">
        <LifecycleRunner />
      </div>

      <section className="dashboard-audits-section">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-sig text-lg font-bold text-white">Your audits</h2>
            <p className="mt-1 text-sm text-slate-500">Memory gate dossiers — evidence → remember → recall → repair → proof</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'ready', 'blocked'] as const).map((f) => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                type="button"
              >
                {f === 'all' ? 'All' : f === 'ready' ? '✓ Ship-ready' : '⚠ Blocked'}
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
                ? 'No audits yet. Create one or open the WolfPack reference case below.'
                : `No ${filter} audits found.`}
            </p>
            <Link className="ent-btn ent-btn-primary mt-4 inline-block" to="/cases/new">
              Create audit
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((c, i) => {
              const ready = (c.lastScore ?? 0) >= 80;
              const progress = c.lastScore ?? 0;
              return (
                <motion.div
                  key={c.id}
                  animate={{ opacity: 1, y: 0 }}
                  className="ent-case-row case-row-enhanced"
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="case-row-progress" style={{ width: `${progress}%` }} />
                  <div className="relative flex flex-1 flex-wrap items-center gap-4">
                    <span className="case-status-icon">{statusIcon[c.status] ?? '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link className="font-sig text-lg font-bold text-white hover:text-cyan-200" to={`/cases/${c.id}`}>
                          {c.name}
                        </Link>
                        {c.lastScore != null ? (
                          <span className={`ship-pill ${ready ? 'ready' : 'blocked'}`}>
                            {ready ? 'Ship clear' : 'Gate blocked'} · {c.lastScore}%
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-400">{c.description || c.agent}</p>
                      <div className="mt-2 flex flex-wrap gap-3 font-hud text-[10px] uppercase tracking-wider text-slate-500">
                        <span className={statusColor[c.status] ?? 'text-slate-400'}>{c.status}</span>
                        <span>{c.evidence?.length ?? 0} evidence</span>
                        <span>{c.tests?.length ?? 0} tests</span>
                        <span>{c.dataset}</span>
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

      {wolfpack ? <ReferenceCaseCard reference={wolfpack} /> : null}
    </div>
  );
}