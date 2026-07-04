import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { CogneeOpsLog } from '../components/CogneeOpsLog';
import { SortationArena, type ArenaStress } from '../components/arcade/SortationArena';
import { SortationScoreboard } from '../components/arcade/SortationScoreboard';
import { WinnerBanner } from '../components/arcade/WinnerBanner';
import { ComplianceGates } from '../components/enterprise/ComplianceGates';
import { MemoryLifecyclePills, statusToLifecycle } from '../components/MemoryLifecyclePills';
import { api, type CaseRecord } from '../api/memgateqaApi';

const tabs = [
  { to: '', label: 'Overview', icon: '📋', end: true },
  { to: 'evidence', label: 'Evidence', icon: '📥', end: false },
  { to: 'tests', label: 'Tests', icon: '🔍', end: false },
  { to: 'results', label: 'Results', icon: '⚖️', end: false },
  { to: 'surgery', label: 'Repair', icon: '🔧', end: false },
  { to: 'report', label: 'Proof', icon: '📜', end: false },
];

export type ArenaLiveState = {
  beltFast?: boolean;
  stress?: ArenaStress;
};

export type CaseOutletContext = {
  caseData: CaseRecord;
  reload: () => void;
  setArenaLive: (patch: ArenaLiveState) => void;
};

export function CaseLayout() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation();
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [error, setError] = useState('');
  const [opsOpen, setOpsOpen] = useState(false);
  const [arenaLive, setArenaLiveState] = useState<ArenaLiveState>({});

  const setArenaLive = useCallback((patch: ArenaLiveState) => {
    setArenaLiveState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reload = useCallback(() => {
    if (!caseId) return;
    api.getCase(caseId).then(setCaseData).catch((e) => setError(e.message));
    api.listCases().then(setAllCases).catch(() => {});
  }, [caseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setArenaLiveState({});
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setOpsOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const packets = useMemo(() => {
    if (!caseData) return [];
    const dataIds = caseData.cogneeDataIds ?? {};
    return caseData.evidence.map((e) => ({
      id: e.id,
      title: e.title,
      private: e.sensitivity === 'private' || e.sensitivity === 'secret',
      indexed: Boolean(dataIds[e.id]),
    }));
  }, [caseData]);

  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!caseData) return <div className="case-skeleton h-32" />;

  const base = `/cases/${caseId}`;
  const shipReady = (caseData.lastScore ?? 0) >= 80;
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const dataIds = caseData.cogneeDataIds ?? {};
  const indexedCount = caseData.evidence.filter((e) => dataIds[e.id]).length;

  const completedTabs = [
    true,
    caseData.evidence.length > 0,
    caseData.tests.length > 0,
    (caseData.resultsBefore?.length ?? 0) > 0,
    (caseData.resultsAfter?.length ?? 0) > 0,
    (caseData.reports?.length ?? 0) > 0,
  ];

  const pathStress: ArenaStress | undefined =
    location.pathname.includes('/tests')
      ? arenaLive.stress ?? (failures > 0 ? 'focused' : 'calm')
      : location.pathname.includes('/surgery')
        ? arenaLive.stress ?? 'strained'
        : location.pathname.includes('/evidence')
          ? arenaLive.stress ?? (arenaLive.beltFast ? 'focused' : 'calm')
          : failures > 4
            ? 'drowning'
            : undefined;

  return (
    <div>
      <SortationScoreboard cases={allCases.length ? allCases : [caseData]} compact featured={caseData} />

      <WinnerBanner show={shipReady} score={caseData.lastScore ?? 0} />

      <div className="mb-4">
        <Link className="breadcrumb-link" to="/">
          ← Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-sig text-2xl font-bold text-white md:text-3xl">{caseData.name}</h1>
              {caseId === 'case-wolfpack' ? <span className="demo-badge">Demo case</span> : null}
            </div>
            <p className="mt-1 text-sm text-slate-400">
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
        <SortationArena
          beltFast={arenaLive.beltFast}
          caseId={caseData.id}
          caseName={caseData.name}
          compact
          dataset={caseData.dataset}
          evidenceCount={caseData.evidence.length}
          failures={failures}
          indexedCount={indexedCount}
          packets={packets}
          score={caseData.lastScore}
          status={caseData.status}
          stressOverride={pathStress}
          testsCount={caseData.tests.length}
        />
      </div>

      {caseData.lastBreakdown ? (
        <div className="mb-6">
          <ComplianceGates breakdown={caseData.lastBreakdown} />
        </div>
      ) : null}

      <nav className="case-tabs">
        {tabs.map((tab, i) => (
          <NavLink
            key={tab.to}
            className={({ isActive }) =>
              `case-tab ${isActive ? 'active' : ''} ${completedTabs[i] ? 'done' : ''}`
            }
            end={tab.end}
            to={tab.to ? `${base}/${tab.to}` : base}
          >
            <span className="case-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {completedTabs[i] ? <span className="case-tab-check">✓</span> : null}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ caseData, reload, setArenaLive } satisfies CaseOutletContext} />

      <CogneeOpsLog caseId={caseData.id} onToggle={() => setOpsOpen((v) => !v)} open={opsOpen} />
    </div>
  );
}