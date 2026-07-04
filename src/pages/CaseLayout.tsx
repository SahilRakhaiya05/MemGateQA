import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { CaseNextStep } from '../components/case/CasePageShell';
import { computeNextStep } from '../components/case/caseNextStep';
import { CogneeOperationPanel } from '../components/CogneeOperationPanel';
import { SortationArena, type ArenaStress } from '../components/arcade/SortationArena';
import { WinnerBanner } from '../components/arcade/WinnerBanner';
import {
  currentLifecycleOp,
  lifecycleForContext,
} from '../components/MemoryLifecyclePills';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { CaseNavProvider } from '../context/CaseNavContext';
import { CASE_STATIONS } from '../components/case/caseStations';
import { api, type CaseRecord } from '../api/memgateqaApi';

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
  const [error, setError] = useState('');

  const [arenaLive, setArenaLiveState] = useState<ArenaLiveState>({});
  const { health } = useCogneeBridge();

  const setArenaLive = useCallback((patch: ArenaLiveState) => {
    setArenaLiveState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reload = useCallback(() => {
    if (!caseId) return;
    api.getCase(caseId).then(setCaseData).catch((e) => setError(e.message));
  }, [caseId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setArenaLiveState({});
  }, [location.pathname]);



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

  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;
  const completedTabs = CASE_STATIONS.map((station) => {
    if (station.id === 'overview') return true;
    if (station.id === 'evidence') return caseData.evidence.length > 0;
    if (station.id === 'tests') return caseData.tests.length > 0;
    if (station.id === 'results') return hasResults;
    if (station.id === 'surgery') return (caseData.resultsAfter?.length ?? 0) > 0;
    if (station.id === 'report') return (caseData.reports?.length ?? 0) > 0;
    return false;
  });

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

  const nextStep = computeNextStep(caseData, location.pathname);
  const navSnapshot = {
    caseId: caseData.id,
    caseData,
    completed: completedTabs,
    indexedCount,
    failures,
    shipReady,
  };

  return (
    <CaseNavProvider value={navSnapshot}>
    <div>
      <WinnerBanner show={shipReady} score={caseData.lastScore ?? 0} />

      <div className="mb-3">
        <Link className="breadcrumb-link" to="/">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <SortationArena
          activeLifecycle={lifecycleForContext(caseData.status, location.pathname, {
            beltFast: arenaLive.beltFast,
            bridgeLive: health?.cognee_reachable,
          })}
          agent={caseData.agent}
          beltFast={arenaLive.beltFast}
          caseId={caseData.id}
          caseName={caseData.name}
          compact
          dataset={caseData.dataset}
          evidenceCount={caseData.evidence.length}
          failures={failures}
          indexedCount={indexedCount}
          lastLifecycleOp={currentLifecycleOp(location.pathname, arenaLive.beltFast)}
          packets={packets}
          score={caseData.lastScore}
          status={caseData.status}
          stressOverride={pathStress}
          testsCount={caseData.tests.length}
        />
      </div>

      <nav className="case-tabs">
        {CASE_STATIONS.map((station, i) => (
          <NavLink
            key={station.id}
            className={({ isActive }) =>
              `case-tab ${isActive ? 'active' : ''} ${completedTabs[i] ? 'done' : ''}`
            }
            end={!station.path}
            to={station.path ? `${base}/${station.path}` : base}
          >
            <span className="case-tab-icon">{station.icon}</span>
            <span>{station.label}</span>
            {completedTabs[i] ? <span className="case-tab-check">✓</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="mb-4">
        <CogneeOperationPanel caseId={caseData.id} compact />
      </div>

      <div className="case-outlet-wrap">
        <Outlet context={{ caseData, reload, setArenaLive } satisfies CaseOutletContext} />
        {nextStep ? (
          <CaseNextStep hint={nextStep.hint} label={nextStep.label} to={nextStep.path} />
        ) : null}
      </div>
    </div>
    </CaseNavProvider>
  );
}