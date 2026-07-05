import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type AutoAgentLogEntry,
  type AutoAgentResult,
  type AutonomousGateLogEntry,
  type AutonomousGateResult,
  type FleetAutoAgentResult,
  type FullLoopResult,
} from '../api/memgateqaApi';

import { FleetAutoPanel } from './FleetAutoPanel';
import { useToast } from './Toast';

type RunPhase = 'idle' | 'gate' | 'agent' | 'loop' | 'fleet' | 'all';

const statusIcon: Record<string, string> = {
  ok: '✓',
  warn: '⚠',
  fail: '✕',
  skip: '—',
};

interface RunAllCommandCenterProps {
  caseId?: string;
  onComplete?: () => void;
  showFleet?: boolean;
  compact?: boolean;
}

export function RunAllCommandCenter({
  caseId = 'case-wolfpack',
  onComplete,
  showFleet = false,
  compact,
}: RunAllCommandCenterProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [gateResult, setGateResult] = useState<AutonomousGateResult | null>(null);
  const [agentResult, setAgentResult] = useState<AutoAgentResult | null>(null);
  const [loopResult, setLoopResult] = useState<FullLoopResult | null>(null);
  const [fleetResult, setFleetResult] = useState<FleetAutoAgentResult | null>(null);
  const [applyRepair, setApplyRepair] = useState(true);
  const [startAutoLoop, setStartAutoLoop] = useState(true);
  const [forceReindex, setForceReindex] = useState(false);
  const [startWatch, setStartWatch] = useState(false);

  const runGate = async () => {
    setPhase('gate');
    const res = await api.runAutonomousGate(caseId, {
      forceReindex,
      startWatch,
      autoCertify: true,
      maxRepairCycles: 3,
    });
    setGateResult(res);
    return res;
  };

  const runAgent = async () => {
    setPhase('agent');
    const res = await api.runAutoAgent(caseId, {
      applyRepair,
      startAutoLoop,
      forceReindex,
      intervalSec: 120,
    });
    setAgentResult(res);
    return res;
  };

  const runLoop = async () => {
    setPhase('loop');
    const res = await api.runFullLoop(caseId);
    setLoopResult(res);
    return res;
  };

  const runFleet = async () => {
    setPhase('fleet');
    const res = await api.runFleetAutoAgent({ applyRepair, startAutoLoop, forceReindex });
    setFleetResult(res);
    return res;
  };

  const runAll = async () => {
    setBusy(true);
    setPhase('all');
    setGateResult(null);
    setAgentResult(null);
    setLoopResult(null);
    try {
      const gate = await runGate();
      const agent = await runAgent();
      const loop = await runLoop();
      toast(
        agent.shipReady || gate.shipReady
          ? `RUN ALL complete · ${agent.health ?? gate.health ?? '—'}%`
          : `RUN ALL done · review logs`,
        agent.shipReady || gate.shipReady ? 'success' : 'info',
      );
      onComplete?.();
      return { gate, agent, loop };
    } catch (err) {
      toast(err instanceof Error ? err.message : 'RUN ALL failed', 'error');
    } finally {
      setPhase('idle');
      setBusy(false);
    }
  };

  const runSingle = async (target: 'gate' | 'agent' | 'loop' | 'fleet') => {
    setBusy(true);
    try {
      if (target === 'gate') {
        const res = await runGate();
        toast(res.shipReady ? `Gate clear · ${res.health}%` : `Gate done · ${res.health ?? '—'}%`, res.shipReady ? 'success' : 'info');
      } else if (target === 'agent') {
        const res = await runAgent();
        toast(res.shipReady ? `Agent clear · ${res.health}%` : `Auto agent done`, res.shipReady ? 'success' : 'info');
      } else if (target === 'loop') {
        await runLoop();
        toast('Full loop tick complete', 'success');
      } else {
        const res = await runFleet();
        toast(`Fleet · ${res.shipReady}/${res.ran} ship-ready`, res.shipReady === res.ran ? 'success' : 'info');
      }
      onComplete?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Run failed', 'error');
    } finally {
      setPhase('idle');
      setBusy(false);
    }
  };

  const gateLog = gateResult?.log ?? [];
  const agentLog = agentResult?.log ?? [];
  const health = agentResult?.health ?? gateResult?.health;
  const shipReady = agentResult?.shipReady ?? gateResult?.shipReady;

  return (
    <section className={`run-all-center ${compact ? 'compact' : ''}`}>
      <div className="run-all-glow" />
      <div className="run-all-inner">
        <div className="run-all-head">
          <div>
            <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-violet-300">Automation</p>
            <h3 className="font-sig text-xl font-bold text-white md:text-2xl">
              Full Cognee memory pipeline
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              remember() → recall() traps → AI repair plan → improve() + forget() → health certificate.
            </p>
          </div>
          <div className="run-all-master-btns">
            <button
              className="ent-btn ent-btn-primary"
              disabled={busy}
              onClick={runAll}
              type="button"
            >
              {busy && phase === 'all' ? 'Running all…' : busy ? `Running ${phase}…` : 'RUN ALL'}
            </button>
            <Link className="ent-btn ent-btn-secondary" to={`/cases/${caseId}`}>
              Case overview
            </Link>
          </div>
        </div>

        <div className="run-all-options">
          <label className="auto-agent-toggle">
            <input checked={applyRepair} onChange={(e) => setApplyRepair(e.target.checked)} type="checkbox" />
            <span>Auto repair</span>
          </label>
          <label className="auto-agent-toggle">
            <input checked={startAutoLoop} onChange={(e) => setStartAutoLoop(e.target.checked)} type="checkbox" />
            <span>Start scheduler</span>
          </label>
          <label className="auto-agent-toggle">
            <input checked={startWatch} onChange={(e) => setStartWatch(e.target.checked)} type="checkbox" />
            <span>Gate watch</span>
          </label>
          <label className="auto-agent-toggle">
            <input checked={forceReindex} onChange={(e) => setForceReindex(e.target.checked)} type="checkbox" />
            <span>Force reindex</span>
          </label>
        </div>

        <div className="run-all-grid">
          <div className={`run-all-card ${phase === 'gate' ? 'active' : ''}`}>
            <p className="run-all-card-kicker">Step 1</p>
            <h4 className="run-all-card-title">Autonomous gate</h4>
            <p className="run-all-card-hint">remember → traps → AI diagnose → repair → certify</p>
            <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={busy} onClick={() => runSingle('gate')} type="button">
              Run gate
            </button>
          </div>
          <div className={`run-all-card ${phase === 'agent' ? 'active' : ''}`}>
            <p className="run-all-card-kicker">Step 2</p>
            <h4 className="run-all-card-title">Auto agent</h4>
            <p className="run-all-card-hint">Memory sync → audit → repair → scheduler</p>
            <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={busy} onClick={() => runSingle('agent')} type="button">
              Run auto agent
            </button>
          </div>
          <div className={`run-all-card ${phase === 'loop' ? 'active' : ''}`}>
            <p className="run-all-card-kicker">Step 3</p>
            <h4 className="run-all-card-title">Full loop</h4>
            <p className="run-all-card-hint">observe → recall → grade → plan (LLM)</p>
            <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={busy} onClick={() => runSingle('loop')} type="button">
              Run full loop
            </button>
          </div>
          {showFleet ? (
            <div className={`run-all-card ${phase === 'fleet' ? 'active' : ''}`}>
              <p className="run-all-card-kicker">Fleet</p>
              <h4 className="run-all-card-title">All audits</h4>
              <p className="run-all-card-hint">Auto agent on every case with tests</p>
              <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={busy} onClick={() => runSingle('fleet')} type="button">
                Run fleet
              </button>
            </div>
          ) : null}
        </div>

        {gateResult?.pendingRepairPlan && !compact ? (
          <div className="run-all-repair-plan ent-card p-3 border border-violet-400/20">
            <p className="font-hud text-[9px] uppercase tracking-wider text-violet-300">AI repair plan</p>
            <p className="mt-1 text-sm text-slate-300 line-clamp-4">{gateResult.pendingRepairPlan}</p>
            <Link className="ent-btn ent-btn-ghost ent-btn-sm mt-2 inline-block" to={`/cases/${caseId}/surgery`}>
              Open surgery →
            </Link>
          </div>
        ) : null}

        {health != null ? (
          <div className="run-all-summary">
            <span className={`ship-pill ${shipReady ? 'ready' : 'blocked'}`}>
              {shipReady ? 'SHIP CLEAR' : 'GATE BLOCKED'} · {health}%
            </span>
            {agentResult?.scheduler?.running ? (
              <span className="auto-agent-badge live">Scheduler · {agentResult.scheduler.intervalSec}s</span>
            ) : null}
            {fleetResult ? (
              <span className="auto-agent-badge">
                Fleet {fleetResult.shipReady}/{fleetResult.ran} clear
              </span>
            ) : null}
          </div>
        ) : null}

        {busy ? (
          <div className="auto-agent-running">
            <span className="auto-agent-pulse" />
            <p className="text-sm text-slate-400">
              {phase === 'gate' && 'Autonomous gate — Cognee lifecycle + AI diagnosis…'}
              {phase === 'agent' && 'Auto agent — memory sync → audit → repair → scheduler…'}
              {phase === 'loop' && 'Full loop — observe → recall → grade → plan…'}
              {phase === 'fleet' && 'Fleet auto agent across all audits…'}
              {phase === 'all' && 'RUN ALL — gate → agent → loop…'}
            </p>
          </div>
        ) : null}

        {(gateLog.length > 0 || agentLog.length > 0) && !compact ? (
          <div className="run-all-logs">
            {gateLog.length > 0 ? (
              <ol className="run-all-log-list">
                <p className="font-hud text-[9px] uppercase tracking-wider text-cyan-400">Gate log</p>
                {gateLog.slice(-5).map((entry: AutonomousGateLogEntry, i) => (
                  <li key={`g-${entry.t}-${i}`} className={`autonomous-gate-log-row level-${entry.level}`}>
                    <span className="autonomous-gate-log-phase">{entry.phase}</span>
                    <span className="autonomous-gate-log-msg">{entry.message}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            {agentLog.length > 0 ? (
              <ol className="auto-agent-timeline">
                <p className="font-hud text-[9px] uppercase tracking-wider text-violet-400">Agent log</p>
                {agentLog.map((entry: AutoAgentLogEntry, i) => (
                  <li key={`a-${entry.step}-${i}`} className={`auto-agent-step auto-agent-step-${entry.status}`}>
                    <span className="auto-agent-step-icon">{statusIcon[entry.status] ?? '·'}</span>
                    <div className="auto-agent-step-body">
                      <p className="auto-agent-step-title">{entry.step}</p>
                      <p className="auto-agent-step-detail">{entry.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}

        {loopResult && !compact ? (
          <p className="text-xs text-slate-500">
            Loop tick · health {loopResult.health ?? '—'}% · ticks {loopResult.ticks?.length ?? 0}
          </p>
        ) : null}

        <p className="run-all-footer text-xs text-slate-600">
          CLI: <code className="font-hud">npm run gate</code> · <code className="font-hud">npm run agent:run</code> ·{' '}
          <code className="font-hud">npm run agent:fleet</code> · MCP:{' '}
          <code className="font-hud">memgateqa_run_auto_agent</code> ·{' '}
          <code className="font-hud">memgateqa_autonomous_gate</code>
        </p>
      </div>

      {showFleet && !compact ? (
        <div className="mt-4">
          <FleetAutoPanel onComplete={onComplete} />
        </div>
      ) : null}
    </section>
  );
}