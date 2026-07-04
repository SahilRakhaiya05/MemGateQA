import { useState } from 'react';
import { api, type AutoAgentLogEntry, type AutoAgentResult } from '../api/memgateqaApi';
import { useToast } from './Toast';

interface AutoAgentPanelProps {
  caseId: string;
  onComplete?: () => void;
}

const STEP_LABELS: Record<string, string> = {
  init: 'Initialize',
  sync_memory: 'Sync memory',
  auto_audit: 'Auto audit',
  auto_repair: 'Auto repair',
  auto_rerun: 'Post-repair rerun',
  auto_scheduler: 'Auto loop scheduler',
};

const statusIcon: Record<string, string> = {
  ok: '✓',
  warn: '⚠',
  fail: '✕',
  skip: '—',
};

export function AutoAgentPanel({ caseId, onComplete }: AutoAgentPanelProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AutoAgentResult | null>(null);
  const [applyRepair, setApplyRepair] = useState(true);
  const [startAutoLoop, setStartAutoLoop] = useState(true);
  const [forceReindex, setForceReindex] = useState(false);
  const [intervalSec, setIntervalSec] = useState(120);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.runAutoAgent(caseId, {
        applyRepair,
        startAutoLoop,
        intervalSec,
        forceReindex,
      });
      setResult(res);
      toast(
        res.shipReady ? `Ship clear · ${res.health}%` : `Auto agent done · ${res.health ?? '—'}%`,
        res.shipReady ? 'success' : 'info',
      );
      onComplete?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Auto agent failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const log = result?.log ?? [];

  return (
    <section className="auto-agent-panel">
      <div className="auto-agent-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">Autonomous agent</p>
          <h3 className="font-sig text-lg font-bold text-white">One click — memory · traps · repair · loop</h3>
          <p className="mt-1 text-sm text-slate-400">
            Syncs MemGate memory, runs full Cognee audit, applies repair if needed, starts auto loop until ship-ready.
          </p>
        </div>
        <button className="ent-btn ent-btn-primary ent-btn-sm" disabled={busy} onClick={run} type="button">
          {busy ? 'Running…' : 'Run auto agent'}
        </button>
      </div>

      <div className="auto-agent-options">
        <label className="auto-agent-toggle">
          <input checked={applyRepair} onChange={(e) => setApplyRepair(e.target.checked)} type="checkbox" />
          <span>Auto repair</span>
        </label>
        <label className="auto-agent-toggle">
          <input checked={startAutoLoop} onChange={(e) => setStartAutoLoop(e.target.checked)} type="checkbox" />
          <span>Start scheduler</span>
        </label>
        <label className="auto-agent-toggle">
          <input checked={forceReindex} onChange={(e) => setForceReindex(e.target.checked)} type="checkbox" />
          <span>Force reindex</span>
        </label>
        <label className="font-hud text-[9px] uppercase tracking-wider text-slate-500">
          Interval (sec)
          <input
            className="ent-input mt-1 w-20"
            disabled={busy}
            min={30}
            onChange={(e) => setIntervalSec(Number(e.target.value) || 120)}
            type="number"
            value={intervalSec}
          />
        </label>
      </div>

      {result ? (
        <div className="auto-agent-summary">
          <span className={`ship-pill ${result.shipReady ? 'ready' : 'blocked'}`}>
            {result.shipReady ? 'Ship clear' : 'Gate blocked'} · {result.health ?? '—'}%
          </span>
          {result.scheduler?.running ? (
            <span className="auto-agent-badge live">Scheduler running · {result.scheduler.intervalSec}s</span>
          ) : null}
        </div>
      ) : null}

      {log.length > 0 ? (
        <ol className="auto-agent-timeline">
          {log.map((entry: AutoAgentLogEntry, i) => (
            <li key={`${entry.step}-${i}`} className={`auto-agent-step auto-agent-step-${entry.status}`}>
              <span className="auto-agent-step-icon">{statusIcon[entry.status] ?? '·'}</span>
              <div className="auto-agent-step-body">
                <p className="auto-agent-step-title">{STEP_LABELS[entry.step] ?? entry.step}</p>
                <p className="auto-agent-step-detail">{entry.detail}</p>
                <time className="auto-agent-step-time">{entry.t.slice(11, 19)}</time>
              </div>
            </li>
          ))}
        </ol>
      ) : busy ? (
        <div className="auto-agent-running">
          <span className="auto-agent-pulse" />
          <p className="text-sm text-slate-400">Agent pipeline running — memory sync → audit → repair → scheduler…</p>
        </div>
      ) : null}

      <p className="text-xs text-slate-600">
        MCP: <code className="font-hud">memgateqa_run_auto_agent</code> · CLI:{' '}
        <code className="font-hud">npm run agent:run</code> · SDK:{' '}
        <code className="font-hud">sdk.runAutoAgent()</code>
      </p>
    </section>
  );
}