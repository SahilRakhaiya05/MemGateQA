import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DemoTour } from '../components/DemoTour';
import { FactoryFloor } from '../components/FactoryFloor';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { QuickDemoRunner } from '../components/QuickDemoRunner';
import { RoiPayoffCard } from '../components/arcade/RoiPayoffCard';
import { SortationScoreboard } from '../components/arcade/SortationScoreboard';
import { WinnerBanner } from '../components/arcade/WinnerBanner';
import { GatePulseStrip } from '../components/GatePulseStrip';
import { LiveOpsFeed } from '../components/LiveOpsFeed';
import { PlatformHighlights } from '../components/enterprise/PlatformHighlights';
import { EnterpriseMetrics } from '../components/enterprise/EnterpriseMetrics';
import { UseCaseSection } from '../components/enterprise/UseCaseSection';
import { GoButton } from '../components/arcade/GoButton';
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
  const navigate = useNavigate();
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

  const featured = cases.find((c) => c.id === 'case-wolfpack') ?? cases[0];

  const featuredPackets = useMemo(() => {
    if (!featured) return [];
    const dataIds = featured.cogneeDataIds ?? {};
    return (featured.evidence ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      private: e.sensitivity === 'private' || e.sensitivity === 'secret',
      indexed: Boolean(dataIds[e.id]),
    }));
  }, [featured]);

  const filtered = cases.filter((c) => {
    if (filter === 'ready') return (c.lastScore ?? 0) >= 80;
    if (filter === 'blocked') return c.lastScore != null && (c.lastScore ?? 0) < 80;
    return true;
  });

  const readyCount = cases.filter((c) => (c.lastScore ?? 0) >= 80).length;

  return (
    <div className="space-y-10">
      <div className="dashboard-hero-strip">
        <div>
          <p className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">Sortation arena</p>
          <h1 className="font-sig text-2xl font-bold text-white">Memory QA factory</h1>
          <p className="mt-1 text-sm text-slate-400">
            {cases.length} audits · {readyCount} ship-ready · Cognee remember → recall → improve → forget
          </p>
        </div>
        <div className="dashboard-hero-pills">
          <span className="dashboard-hero-pill">📥 Evidence</span>
          <span className="dashboard-hero-pill">🔍 Trap tests</span>
          <span className="dashboard-hero-pill">🔧 Repair</span>
          <span className="dashboard-hero-pill">📜 Proof</span>
        </div>
      </div>

      <SortationScoreboard cases={cases} featured={featured} />

      <WinnerBanner score={featured?.lastScore ?? 0} show={(featured?.lastScore ?? 0) >= 80} />

      {featured ? (
        <FactoryFloor
          agent={featured.agent}
          caseId={featured.id}
          caseName={featured.name}
          dataset={featured.dataset}
          evidence={featured.evidence?.length ?? 0}
          failures={(featured.resultsBefore ?? []).filter((r) => r.status === 'fail').length}
          indexedCount={featuredPackets.filter((p) => p.indexed).length}
          packets={featuredPackets}
          score={featured.lastScore}
          status={featured.status}
          tests={featured.tests?.length ?? 0}
        />
      ) : null}

      <div className="arena-dashboard-panels">
        <GatePulseStrip cases={cases} />
        <RoiPayoffCard cases={cases} />
      </div>

      <div className="arena-dashboard-go-row">
        <GoButton label="START AUDIT" onClick={() => navigate('/cases/new')} size="lg" />
        <Link className="ent-btn ent-btn-secondary" to="/cases/case-wolfpack">
          WolfPack demo
        </Link>
      </div>

      <QuickDemoRunner />

      <LiveOpsFeed />
      <EnterpriseMetrics cases={cases} />
      <FeatureShowcase />

      <div className="flex flex-wrap items-center gap-3">
        <DemoTour compact />
        <Link className="ent-btn ent-btn-ghost ent-btn-sm" to="/cases/new">
          + New audit
        </Link>
      </div>

      {error ? (
        <div className="error-banner">
          <p className="font-bold text-red-200">Bridge not reachable</p>
          <p className="mt-1 text-sm text-red-200/80">
            Run <code className="font-hud">.\start.ps1</code> or <code className="font-hud">npm run dev:all</code>
          </p>
          <p className="mt-2 font-hud text-xs opacity-80">{error}</p>
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-sig text-xl font-bold text-white">Memory audit cases</h2>
            <p className="mt-1 text-sm text-slate-500">{cases.length} total · filter by deploy status</p>
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
            <Link className="ent-btn ent-btn-primary ent-btn-sm" to="/cases/new">
              + New audit
            </Link>
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
              {filter === 'all' ? 'No audits yet. Create one or open the WolfPack demo.' : `No ${filter} audits found.`}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link className="ent-btn ent-btn-primary" to="/cases/new">
                Create audit
              </Link>
              <Link className="ent-btn ent-btn-secondary" to="/cases/case-wolfpack">
                WolfPack demo
              </Link>
            </div>
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
                        {c.id === 'case-wolfpack' ? (
                          <span className="demo-badge">Demo</span>
                        ) : null}
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
                    {c.id !== 'case-wolfpack' ? (
                      <button
                        className="ent-btn ent-btn-ghost ent-btn-sm"
                        onClick={() => handleDelete(c.id, c.name)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <UseCaseSection />
      <PlatformHighlights />
    </div>
  );
}