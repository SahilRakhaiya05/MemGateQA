import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { CogneeOpsLog } from '../components/CogneeOpsLog';
import { ComplianceGates } from '../components/enterprise/ComplianceGates';
import { EnterprisePipeline } from '../components/enterprise/EnterprisePipeline';
import { MemoryLifecyclePills, statusToLifecycle } from '../components/MemoryLifecyclePills';
import { api, type CaseRecord } from '../api/memgateqaApi';

const tabs = [
  { to: '', label: 'Overview', end: true },
  { to: 'evidence', label: 'Evidence' },
  { to: 'tests', label: 'Tests' },
  { to: 'results', label: 'Results' },
  { to: 'surgery', label: 'Repair' },
  { to: 'report', label: 'Proof' },
];

export function CaseLayout() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [error, setError] = useState('');
  const [opsOpen, setOpsOpen] = useState(false);

  const reload = useCallback(() => {
    if (!caseId) return;
    api.getCase(caseId).then(setCaseData).catch((e) => setError(e.message));
  }, [caseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setOpsOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!caseData) return <p className="text-slate-500">Loading audit…</p>;

  const base = `/cases/${caseId}`;
  const shipReady = (caseData.lastScore ?? 0) >= 80;

  return (
    <div>
      <div className="mb-6">
        <Link className="text-sm text-slate-500 hover:text-white" to="/">
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-sig text-3xl font-bold text-white">{caseData.name}</h1>
            <p className="text-sm text-slate-400">
              {caseData.agent} · dataset <code className="font-hud text-cyan-300">{caseData.dataset}</code>
            </p>
            <div className="mt-3">
              <MemoryLifecyclePills active={statusToLifecycle(caseData.status)} />
            </div>
          </div>
          {caseData.lastScore != null ? (
            <div className={`ent-ship-badge ${shipReady ? 'ready' : 'blocked'}`}>
              {shipReady ? 'Ship clear' : 'Deploy blocked'} · {caseData.lastScore}%
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-6">
        <EnterprisePipeline
          caseName={caseData.name}
          compact
          score={caseData.lastScore}
          status={caseData.status}
        />
      </div>

      {caseData.lastBreakdown ? (
        <div className="mb-6">
          <ComplianceGates breakdown={caseData.lastBreakdown} />
        </div>
      ) : null}

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            className={({ isActive }) =>
              `rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
            end={tab.end}
            to={tab.to ? `${base}/${tab.to}` : base}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ caseData, reload }} />

      <CogneeOpsLog caseId={caseData.id} onToggle={() => setOpsOpen((v) => !v)} open={opsOpen} />
    </div>
  );
}

export type CaseOutletContext = {
  caseData: CaseRecord;
  reload: () => void;
};