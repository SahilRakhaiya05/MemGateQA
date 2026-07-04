import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { CaseNextStep } from '../components/case/CasePageShell';
import { computeNextStep } from '../components/case/caseNextStep';
import { GateFlowSteps } from '../components/GateFlowSteps';
import { SortationArena, type ArenaStress } from '../components/arcade/SortationArena';
import { WinnerBanner } from '../components/arcade/WinnerBanner';
import {
  currentLifecycleOp,
  lifecycleForContext,
} from '../components/MemoryLifecyclePills';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { CaseNavProvider } from '../context/CaseNavContext';
import { GATE_FLOW_STEPS } from '../components/GateFlowSteps';
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

  const shipReady = (caseData.lastScore ?? 0) >= 80;
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const dataIds = caseData.cogneeDataIds ?? {};
  const indexedCount = caseData.evidence.filter((e) => dataIds[e.id]).length;
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;

  const completedSteps = GATE_FLOW_STEPS.map((step) => {
    if (step.id === 'evidence') return caseData.evidence.length > 0 && indexedCount > 0;
    if (step.id === 'tests') return caseData.tests.length > 0;
    if (step.id === 'results') return hasResults;
    if (step.id === 'surgery') return (caseData.resultsAfter?.length ?? 0) > 0;
    if (step.id === 'report') return (caseData.reports?.length ?? 0) > 0;
    return false;
  });

  const pathStress: ArenaStress | undefined =
    location.pathname.includes('/tests')
      ? arenaLive.stress ?? (failures > 0 ? 'focused' : 'calm')
      : location.pathname.includes('/surgery')
        ? arenaLive.stress ?? 'strained'
        : location.pathname.includes('/evidence')
          ? arenaLive.stress ?? (arenaLive.beltFast ? 'focused' : 'calm')
          : hasResults && failures > 3
            ? 'drowning'
            : undefined;

  const nextStep = computeNextStep(caseData, location.pathname);
  const navSnapshot = {
    caseId: caseData.id,
    caseData,
    completed: completedSteps,
    indexedCount,
    failures,
    shipReady,
  };

  return (
    <CaseNavProvider value={navSnapshot}>
      <div className="case-layout">
        <WinnerBanner show={shipReady} score={caseData.lastScore ?? 0} />

        <Link className="breadcrumb-link" to="/">
          ← Back to home
        </Link>

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
          hasResults={hasResults}
          indexedCount={indexedCount}
          lastLifecycleOp={currentLifecycleOp(location.pathname, arenaLive.beltFast)}
          packets={packets}
          score={caseData.lastScore}
          status={caseData.status}
          stressOverride={pathStress}
          testsCount={caseData.tests.length}
        />

        <GateFlowSteps completed={completedSteps} />

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