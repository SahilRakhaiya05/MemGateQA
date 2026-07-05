import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';


import { GoButton } from '../components/arcade/GoButton';
import { SortationArena, type ArenaStress } from '../components/arcade/SortationArena';
import { WinnerBanner } from '../components/arcade/WinnerBanner';
import {
  currentLifecycleOp,
  lifecycleForContext,
} from '../components/MemoryLifecyclePills';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { useGateLive } from '../hooks/useGateLive';
import {
  gatePhaseLabel,
  gatePhaseToCogneeStress,
  gatePhaseToLastOp,
  gatePhaseToLifecycle,
  gatePhaseToQaStress,
} from '../lib/gateLiveMap';
import { CaseNavProvider } from '../context/CaseNavContext';
import { GATE_FLOW_STEPS } from '../components/GateFlowSteps';
import { api, type CaseRecord } from '../api/memgateqaApi';
import { useToast } from '../components/Toast';
import { CaseGuideStrip } from '../components/case/CaseGuideStrip';
import { CaseStationHost } from '../components/case/CaseStationHost';
import { CaseTabBar } from '../components/case/CaseTabBar';
import { beltStudioTitle } from '../lib/demoCases';
import { FloatingDock } from '../components/FloatingDock';

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
  const { toast } = useToast();
  const { gateStatus, running: gateRunning, runGate } = useGateLive(caseId ?? '');

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
  const reportMeta = caseData.reports?.[0] as { scoreBefore?: number } | undefined;
  const scoreBefore =
    reportMeta?.scoreBefore ??
    ((caseData.resultsAfter?.length ?? 0) > 0 && (caseData.resultsBefore?.length ?? 0) > 0
      ? Math.round(
          (caseData.resultsBefore ?? []).reduce((s, r) => s + r.beforeScore, 0) /
            (caseData.resultsBefore?.length ?? 1),
        )
      : undefined);
  const dataIds = caseData.cogneeDataIds ?? {};
  const indexedCount = caseData.evidence.filter((e) => dataIds[e.id]).length;
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;

  const completedSteps = GATE_FLOW_STEPS.map((step) => {
    if (step.id === 'evidence') return caseData.evidence.length > 0 && indexedCount > 0;
    if (step.id === 'tests') return caseData.tests.length > 0;
    if (step.id === 'results') return hasResults;
    if (step.id === 'surgery') return (caseData.resultsAfter?.length ?? 0) > 0;
    if (step.id === 'report') return (caseData.reports?.length ?? 0) > 0;
    if (step.id === 'agent') return shipReady;
    return false;
  });

  const live = Boolean(health?.cognee_reachable);
  const pending = Math.max(0, caseData.evidence.length - indexedCount);
  const gatePhase = gateStatus?.running ? gateStatus.phase : null;
  const gateHealth = gateStatus?.health ?? caseData.lastScore ?? null;
  const gateShipReady = gateStatus?.shipReady ?? (gateHealth != null && gateHealth >= 80);

  const phaseText = gateRunning ? gatePhaseLabel(gatePhase, true) : undefined;

  const pathStress: ArenaStress | undefined = gateRunning
    ? undefined
    : arenaLive.stress ?? (hasResults && failures > 3 ? 'drowning' : failures > 0 ? 'focused' : 'calm');

  const qaStress = gateRunning
    ? gatePhaseToQaStress(gatePhase, true, failures, gateHealth, gateShipReady)
    : pathStress;
  const cogneeStress = gateRunning
    ? gatePhaseToCogneeStress(gatePhase, true, live, pending, indexedCount, gateShipReady)
    : undefined;
  const activeLifecycle = gateRunning
    ? gatePhaseToLifecycle(gatePhase, true)
    : arenaLive.beltFast
      ? ['remember']
      : lifecycleForContext(caseData.status, '', {
          beltFast: false,
          bridgeLive: health?.cognee_reachable,
        });
  const lastOp = gateRunning
    ? gatePhaseToLastOp(gatePhase, true)
    : arenaLive.beltFast
      ? 'remember'
      : currentLifecycleOp('', false);

  const handleGateGo = async () => {
    try {
      const res = await runGate({ forceReindex: false, startWatch: true, autoCertify: true });
      reload();
      toast(
        res.shipReady ? `SHIP CLEAR · ${res.health}%` : `Gate done · ${res.health ?? '—'}%`,
        res.shipReady ? 'success' : 'info',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gate failed', 'error');
    }
  };

  const navSnapshot = {
    caseId: caseData.id,
    caseData,
    completed: completedSteps,
    indexedCount,
    failures,
    shipReady,
  };
  const isCaseOverview = location.pathname === `/cases/${caseData.id}`;

  return (
    <CaseNavProvider value={navSnapshot}>
      <div className="case-layout">
        {isCaseOverview ? <WinnerBanner show={shipReady} score={caseData.lastScore ?? 0} /> : null}

        <div className="case-layout-head">
          <Link className="breadcrumb-link" to="/">
            ← Back to home
          </Link>
          <p className="case-layout-floor-title font-sig text-sm font-semibold text-slate-300">
            {beltStudioTitle(caseData)}
          </p>
        </div>

        <SortationArena
          compact
          actionSlot={
            <div className="overclocked-go-row">
              <GoButton disabled={gateRunning} label={gateRunning ? 'RUNNING' : 'Run audit'} loading={gateRunning} onClick={handleGateGo} />
            </div>
          }
          activeLifecycle={activeLifecycle}
          agent={caseData.agent}
          gatePhase={gatePhase}
          gateRunning={gateRunning}
          manualIndexing={Boolean(arenaLive.beltFast)}
          caseId={caseData.id}
          caseName={caseData.name}
          cogneeStressOverride={cogneeStress}
          dataset={caseData.dataset}
          evidenceCount={caseData.evidence.length}
          failures={failures}
          hasResults={hasResults}
          indexedCount={indexedCount}
          lastLifecycleOp={lastOp}
          packets={packets}
          phaseLabel={phaseText}
          qaStressOverride={qaStress}
          score={gateHealth}
          scoreBefore={scoreBefore}
          status={caseData.status}
          stressOverride={pathStress}
          testsCount={caseData.tests.length}
        />

        <CaseGuideStrip caseData={caseData} />
        <CaseTabBar />
        <div className="case-outlet-wrap">
          <CaseStationHost workspace={{ caseData, reload, setArenaLive }} />
        </div>
        <FloatingDock />
      </div>
    </CaseNavProvider>
  );
}
