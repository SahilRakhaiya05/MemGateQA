import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DesignCredits } from '../components/enterprise/DesignCredits';
import { EnterpriseHero } from '../components/enterprise/EnterpriseHero';
import { EnterpriseMetrics } from '../components/enterprise/EnterpriseMetrics';
import { EnterprisePipeline } from '../components/enterprise/EnterprisePipeline';
import { UseCaseSection } from '../components/enterprise/UseCaseSection';
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
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-10">
      <EnterpriseHero />

      <EnterpriseMetrics cases={cases} />

      {featured ? (
        <EnterprisePipeline
          caseName={featured.name}
          score={featured.lastScore}
          status={featured.status}
        />
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
          <p className="font-bold">Bridge not reachable</p>
          <p className="mt-1 text-sm">
            Run <code className="font-hud">.\start.ps1</code> or <code className="font-hud">npm run dev:all</code>
          </p>
          <p className="mt-2 font-hud text-xs opacity-80">{error}</p>
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sig text-xl font-bold text-white">Memory audit cases</h2>
          <Link className="ent-btn ent-btn-primary ent-btn-sm" to="/cases/new">
            + New audit
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : cases.length === 0 ? (
          <div className="ent-empty">
            <p className="text-slate-400">No audits yet. Create one or open the WolfPack demo.</p>
            <div className="mt-4 flex gap-3">
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
            {cases.map((c) => {
              const ready = (c.lastScore ?? 0) >= 80;
              return (
                <div key={c.id} className="ent-case-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link className="font-sig text-lg font-bold text-white hover:text-cyan-200" to={`/cases/${c.id}`}>
                        {c.name}
                      </Link>
                      {c.lastScore != null ? (
                        <span
                          className={`rounded-full border px-2 py-0.5 font-hud text-[10px] uppercase ${ready ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/40 text-amber-300'}`}
                        >
                          {ready ? 'Ship clear' : 'Gate blocked'} · {c.lastScore}%
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{c.description || c.agent}</p>
                    <div className="mt-2 flex flex-wrap gap-3 font-hud text-[10px] uppercase tracking-wider text-slate-500">
                      <span className={statusColor[c.status] ?? 'text-slate-400'}>{c.status}</span>
                      <span>{c.evidence?.length ?? 0} evidence</span>
                      <span>{c.tests?.length ?? 0} tests</span>
                      <span>{c.dataset}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      <UseCaseSection />
      <DesignCredits />
    </div>
  );
}