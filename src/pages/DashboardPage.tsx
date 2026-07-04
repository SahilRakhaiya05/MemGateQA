import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { GateFlowExplainer } from '../components/GateFlowSteps';
import { LifecycleRunner } from '../components/LifecycleRunner';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { api, type CaseRecord } from '../api/memgateqaApi';

export function DashboardPage() {
  const { health } = useCogneeBridge();
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

  const mode = health?.mode ?? 'offline';
  const live = health?.cognee_reachable;

  return (
    <div className="dashboard-simple">
      <header className="dashboard-simple-hero">
        <p className="font-hud text-[10px] uppercase tracking-widest text-cyan-300">MemGateQA × Cognee</p>
        <h1 className="dashboard-simple-title">Test agent memory before you ship</h1>
        <p className="dashboard-simple-sub">
          Cognee remembers. MemGateQA proves it is safe — stale facts, leaks, and bad forgets get caught in 5 steps.
        </p>
        <p className="dashboard-simple-bridge">
          Bridge: {live ? 'Cognee live' : mode === 'mock' ? 'Mock (no keys needed)' : 'Offline — run start.ps1'}
        </p>
      </header>

      <GateFlowExplainer />

      {error ? (
        <div className="error-banner">
          <p className="font-bold text-red-200">Bridge not reachable</p>
          <p className="mt-1 text-sm">Run <code className="font-hud">.\start.ps1</code></p>
        </div>
      ) : null}

      <section className="dashboard-simple-demo ent-card">
        <div className="dashboard-simple-demo-head">
          <div>
            <h2 className="font-sig text-xl font-bold text-white">🐺 WolfPack demo</h2>
            <p className="mt-1 text-sm text-slate-400">Press GO — runs all 5 steps automatically.</p>
          </div>
        </div>
        <LifecycleRunner />
      </section>

      <section className="dashboard-simple-audits">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-sig text-lg font-bold text-white">Your audits</h2>
          <Link className="ent-btn ent-btn-secondary ent-btn-sm" to="/cases/new">
            + New audit
          </Link>
        </div>

        {loading ? (
          <div className="case-skeleton h-20" />
        ) : cases.filter((c) => c.id !== 'case-wolfpack').length === 0 ? (
          <p className="text-sm text-slate-500">No custom audits yet. Run WolfPack above first.</p>
        ) : (
          <div className="grid gap-2">
            {cases
              .filter((c) => c.id !== 'case-wolfpack')
              .map((c) => (
                <Link key={c.id} className="dashboard-audit-row" to={`/cases/${c.id}/evidence`}>
                  <span className="font-sig font-bold text-white">{c.name}</span>
                  <span className="text-sm text-slate-500">
                    {c.lastScore != null ? `${c.lastScore}%` : 'Not run'}
                  </span>
                </Link>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}