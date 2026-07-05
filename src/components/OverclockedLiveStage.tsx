import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { useGateLive } from '../hooks/useGateLive';
import {
  GATE_PHASES,
  gatePhaseIndex,
  gatePhaseLabel,
  gatePhaseToCogneeStress,
  gatePhaseToLastOp,
  gatePhaseToLifecycle,
  gatePhaseToQaStress,
} from '../lib/gateLiveMap';
import { useToast } from './Toast';
import { GoButton } from './arcade/GoButton';
import { SortationArena } from './arcade/SortationArena';
import { WinnerBanner } from './arcade/WinnerBanner';
import { BELT } from '../copy/brand';
import { beltStudioTitle } from '../lib/demoCases';

interface OverclockedLiveStageProps {
  caseId?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function OverclockedLiveStage({
  caseId = 'case-data-dna',
  showHeader = true,
  compact = false,
}: OverclockedLiveStageProps) {
  const { health } = useCogneeBridge();
  const { toast } = useToast();
  const { caseData, gateStatus, gateResult, loading, error, running, runGate } = useGateLive(caseId);

  const phase = gateStatus?.running ? gateStatus.phase : null;
  const healthScore = gateResult?.health ?? gateStatus?.health ?? caseData?.lastScore ?? null;
  const shipReady = gateResult?.shipReady ?? gateStatus?.shipReady ?? (healthScore != null && healthScore >= 80);

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

  const failures = (caseData?.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const dataIds = caseData?.cogneeDataIds ?? {};
  const indexedCount = caseData?.evidence.filter((e) => dataIds[e.id]).length ?? 0;
  const hasResults = (caseData?.resultsBefore?.length ?? 0) > 0;
  const live = Boolean(health?.cognee_reachable);
  const pending = Math.max(0, (caseData?.evidence.length ?? 0) - indexedCount);

  const phaseText = running ? gatePhaseLabel(phase, running) : undefined;
  const activeLifecycle = running ? gatePhaseToLifecycle(phase, running) : [];
  const lastOp = running ? gatePhaseToLastOp(phase, running) : undefined;
  const qaStress = gatePhaseToQaStress(phase, running, failures, healthScore, Boolean(shipReady));
  const cogneeStress = gatePhaseToCogneeStress(phase, running, live, pending, indexedCount, Boolean(shipReady));

  const log = gateResult?.log ?? gateStatus?.log ?? [];
  const activeIdx = gatePhaseIndex(phase);

  const handleGo = async () => {
    try {
      const res = await runGate({ forceReindex: true, startWatch: true, autoCertify: true });
      toast(
        res.shipReady ? `SHIP CLEAR · ${res.health}%` : `Belt done · ${res.health ?? '—'}%`,
        res.shipReady ? 'success' : 'info',
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Belt failed — run start.ps1', 'error');
    }
  };

  if (loading && !caseData) {
    return <div className="case-skeleton h-64 overclocked-stage-skeleton" />;
  }

  return (
    <section className={`overclocked-live-stage ${compact ? 'compact' : ''}`}>
      <WinnerBanner score={healthScore ?? 0} show={Boolean(shipReady)} />
      {shipReady ? (
        <div className="overclocked-crown-row" aria-hidden>
          <span className="overclocked-crown">👑</span>
          <span className="font-hud text-[10px] uppercase tracking-widest text-amber-300">Ship clear — full speed</span>
        </div>
      ) : failures > 3 ? (
        <div className="overclocked-tombstone" aria-hidden>
          <span className="overclocked-tombstone-text">R.I.P. THROUGHPUT</span>
          <span className="text-xs text-slate-500">{failures} recall misses · hit {BELT.go}</span>
        </div>
      ) : null}
      {showHeader ? (
        <header className="overclocked-stage-head">
          <div>
            <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-orange-300">{BELT.kicker}</p>
            <h2 className="font-sig text-xl font-bold text-white sm:text-2xl">
              {beltStudioTitle(caseData ?? undefined)}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">{BELT.sub}</p>
          </div>
          <div className="overclocked-stage-bridge">
            <span className={`overclocked-bridge-pill ${live ? 'live' : 'offline'}`}>
              {live ? 'Cognee live' : 'Offline'}
            </span>
            <Link className="ent-btn ent-btn-ghost ent-btn-sm" to={`/cases/${caseId}`}>
              Open case →
            </Link>
          </div>
        </header>
      ) : null}

      {error ? (
        <div className="error-banner mb-3">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      ) : null}

      <SortationArena
        actionSlot={
          <div className="overclocked-go-row">
            <GoButton disabled={running} label={running ? BELT.running : BELT.go} loading={running} onClick={handleGo} />
            {healthScore != null ? (
              <span className={`ship-pill ${shipReady ? 'ready' : 'blocked'}`}>
                {shipReady ? 'SHIP CLEAR' : 'HOLD'} · {healthScore}%
              </span>
            ) : null}
          </div>
        }
        activeLifecycle={activeLifecycle}
        agent={caseData?.agent}
        caseId={caseId}
        caseName={caseData?.name}
        cogneeStressOverride={cogneeStress}
        compact={compact}
        dataset={caseData?.dataset}
        evidenceCount={caseData?.evidence.length ?? 0}
        failures={failures}
        gatePhase={phase}
        gateRunning={running}
        hasResults={hasResults}
        indexedCount={indexedCount}
        lastLifecycleOp={lastOp}
        packets={packets}
        phaseLabel={phaseText}
        qaStressOverride={qaStress}
        score={healthScore}
        status={caseData?.status ?? 'open'}
        testsCount={caseData?.tests.length ?? 0}
      />

      <div className="overclocked-phase-strip">
        {GATE_PHASES.map((p, i) => {
          const state = running && phase === p.id ? 'active' : i < activeIdx || shipReady ? 'done' : '';
          return (
            <div key={p.id} className={`overclocked-phase-chip ${state}`}>
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </div>
          );
        })}
      </div>

      {log.length > 0 ? (
        <ol className="overclocked-gate-log">
          {log.slice(-6).map((entry, i) => (
            <li key={`${entry.t}-${i}`} className={`overclocked-gate-log-row level-${entry.level}`}>
              <span className="overclocked-gate-log-phase">{entry.phase}</span>
              <span>{entry.message}</span>
            </li>
          ))}
        </ol>
      ) : running ? (
        <p className="overclocked-gate-running text-sm text-slate-500">
          Belt running — operators sync to gate phase…
        </p>
      ) : null}
    </section>
  );
}

/** @deprecated use OverclockedLiveStage with caseId */
export function WolfPackOverclockedStage() {
  return <OverclockedLiveStage caseId="case-wolfpack" />;
}

export function LiveBeltStage({ caseId }: { caseId: string }) {
  return <OverclockedLiveStage caseId={caseId} />;
}