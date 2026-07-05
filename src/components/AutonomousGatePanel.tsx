import { useCallback, useEffect, useState } from 'react';
import { api, type AutonomousGateLogEntry, type AutonomousGateResult, type AutonomousGateStatus } from '../api/memgateqaApi';
import { useToast } from './Toast';

const PHASES = [
  { id: 'observe', step: '01', label: 'Observe' },
  { id: 'index', step: '02', label: 'Index' },
  { id: 'interrogate', step: '03', label: 'Traps' },
  { id: 'diagnose', step: '04', label: 'Diagnose' },
  { id: 'repair', step: '05', label: 'Repair' },
  { id: 'verify', step: '06', label: 'Verify' },
  { id: 'certify', step: '07', label: 'Certify' },
];

interface AutonomousGatePanelProps {
  caseId: string;
  onComplete?: () => void;
  compact?: boolean;
}

export function AutonomousGatePanel({ caseId, onComplete, compact }: AutonomousGatePanelProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AutonomousGateStatus | null>(null);
  const [result, setResult] = useState<AutonomousGateResult | null>(null);
  const [autoWatch, setAutoWatch] = useState(true);
  const [forceReindex, setForceReindex] = useState(false);

  const refresh = useCallback(() => {
    api.gateStatus(caseId).then(setStatus).catch(() => setStatus(null));
  }, [caseId]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, status?.running ? 1500 : 5000);
    return () => clearInterval(t);
  }, [refresh, status?.running]);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.runAutonomousGate(caseId, {
        forceReindex,
        startWatch: autoWatch,
        autoCertify: true,
        maxRepairCycles: 3,
      });
      setResult(res);
      refresh();
      toast(
        res.shipReady ? `Autonomous gate: SHIP CLEAR ${res.health}%` : `Gate done · ${res.health ?? '—'}%`,
        res.shipReady ? 'success' : 'info',
      );
      onComplete?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Autonomous gate failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const activePhase = status?.running ? status.phase : result ? 'idle' : null;
  const log = result?.log ?? status?.log ?? [];
  const health = result?.health ?? status?.health;
  const shipReady = result?.shipReady ?? status?.shipReady;

  return (
    <section className={`autonomous-gate-panel ${compact ? 'compact' : ''}`}>
      <div className="autonomous-gate-glow" />
      <div className="autonomous-gate-inner">
        <div className="autonomous-gate-head">
          <div>
            <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-cyan-300">Autonomous Memory Gate</p>
            <h3 className="font-sig text-xl font-bold text-white md:text-2xl">
              AI agent owns the full loop
            </h3>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Add memory → auto index → trap tests → AI diagnoses → improve + forget → verify → certificate.
              No manual steps.
            </p>
          </div>
          <button className="ent-btn ent-btn-primary" disabled={busy || status?.running} onClick={run} type="button">
            {busy || status?.running ? 'Agent running…' : 'Run autonomous gate'}
          </button>
        </div>

        {!compact ? (
          <div className="autonomous-gate-options">
            <label className="auto-agent-toggle">
              <input checked={autoWatch} onChange={(e) => setAutoWatch(e.target.checked)} type="checkbox" />
              <span>Watch until ship-ready</span>
            </label>
            <label className="auto-agent-toggle">
              <input checked={forceReindex} onChange={(e) => setForceReindex(e.target.checked)} type="checkbox" />
              <span>Force reindex</span>
            </label>
            {status?.watching ? (
              <span className="auto-agent-badge live">Watch mode active</span>
            ) : null}
          </div>
        ) : null}

        <div className="autonomous-gate-phases">
          {PHASES.map((p) => {
            const idx = PHASES.findIndex((x) => x.id === activePhase);
            const pIdx = PHASES.findIndex((x) => x.id === p.id);
            const state = activePhase === p.id ? 'active' : pIdx < idx || shipReady ? 'done' : '';
            return (
              <div key={p.id} className={`autonomous-gate-phase ${state}`}>
                <span className="autonomous-gate-phase-icon" aria-hidden="true">{p.step}</span>
                <span className="autonomous-gate-phase-label">{p.label}</span>
              </div>
            );
          })}
        </div>

        {health != null ? (
          <div className="autonomous-gate-score">
            <span className={`ship-pill ${shipReady ? 'ready' : 'blocked'}`}>
              {shipReady ? 'SHIP CLEAR' : 'GATE BLOCKED'} · {health}%
            </span>
            {result?.repairCycles ? (
              <span className="text-xs text-slate-500">{result.repairCycles} repair cycle(s)</span>
            ) : null}
          </div>
        ) : null}

        {log.length > 0 ? (
          <ol className="autonomous-gate-log">
            {log.slice(-8).map((entry: AutonomousGateLogEntry, i) => (
              <li key={`${entry.t}-${i}`} className={`autonomous-gate-log-row level-${entry.level}`}>
                <span className="autonomous-gate-log-phase">{entry.phase}</span>
                <span className="autonomous-gate-log-msg">{entry.message}</span>
              </li>
            ))}
          </ol>
        ) : busy || status?.running ? (
          <div className="autonomous-gate-running">
            <span className="autonomous-gate-pulse" />
            <p className="text-sm text-slate-400">Agent pipeline active — Cognee lifecycle + AI diagnosis…</p>
          </div>
        ) : null}

        <p className="autonomous-gate-footer text-xs text-slate-600">
          Auto-triggers on <code>remember()</code> when <code>MEMGATEQA_AUTONOMOUS=true</code> · MCP:{' '}
          <code>memgateqa_autonomous_gate</code> · CLI: <code>npm run gate</code>
        </p>
      </div>
    </section>
  );
}
