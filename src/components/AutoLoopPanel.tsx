import { useCallback, useEffect, useState } from 'react';
import { api, type AutoLoopStatus } from '../api/memgateqaApi';
import { useToast } from './Toast';

interface AutoLoopPanelProps {
  caseId: string;
  hasResults: boolean;
  onLoopComplete?: () => void;
}

export function AutoLoopPanel({ caseId, hasResults, onLoopComplete }: AutoLoopPanelProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<AutoLoopStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [intervalSec, setIntervalSec] = useState(120);

  const refresh = useCallback(() => {
    api.autoLoopStatus(caseId).then(setStatus).catch(() => setStatus(null));
  }, [caseId]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const runFull = async () => {
    setBusy(true);
    try {
      const res = await api.runFullLoop(caseId);
      toast(
        res.shipReady ? `Ship ready · ${res.health}%` : `Loop complete · ${res.ticks.length} steps`,
        res.shipReady ? 'success' : 'info',
      );
      onLoopComplete?.();
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Full loop failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleAuto = async () => {
    setBusy(true);
    try {
      if (status?.running) {
        await api.autoLoopStop(caseId);
        toast('Auto loop stopped', 'info');
      } else {
        await api.autoLoopStart(caseId, intervalSec);
        toast(`Auto loop started · every ${intervalSec}s`, 'success');
      }
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Auto loop failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auto-loop-panel">
      <div className="auto-loop-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-emerald-300">Auto loop engine</p>
          <h3 className="font-sig text-lg font-bold text-white">observe → recall → grade → plan → verify</h3>
          <p className="mt-1 text-sm text-slate-400">
            {status?.running
              ? `Running · ${status.runCount} cycles · last ${status.lastRunAt?.slice(11, 19) ?? '—'}`
              : 'Runs full memory QA loop on interval until ship-ready (≥80%)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="ent-btn ent-btn-ghost ent-btn-sm" disabled={busy || !hasResults} onClick={runFull} type="button">
            Run full loop
          </button>
          <button
            className={`ent-btn ent-btn-sm ${status?.running ? 'ent-btn-ghost' : 'ent-btn-primary'}`}
            disabled={busy || !hasResults}
            onClick={toggleAuto}
            type="button"
          >
            {status?.running ? 'Stop auto' : 'Start auto'}
          </button>
        </div>
      </div>

      <div className="auto-loop-controls">
        <label className="font-hud text-[9px] uppercase tracking-wider text-slate-500">
          Interval (sec)
          <input
            className="ent-input mt-1 w-24"
            disabled={status?.running || busy}
            min={30}
            onChange={(e) => setIntervalSec(Number(e.target.value) || 120)}
            type="number"
            value={intervalSec}
          />
        </label>
        {status?.lastResult ? (
          <p className="text-xs text-slate-500">
            Last: health {status.lastResult.health ?? '—'}% · {status.lastResult.ticks?.length ?? 0} steps
            {status.lastResult.shipReady ? ' · ship cleared' : ''}
          </p>
        ) : null}
      </div>

      <p className="text-xs text-slate-600">
        CLI: <code className="font-hud">python server/memgate_cli.py loop auto start {caseId}</code> · MCP:{' '}
        <code className="font-hud">memgateqa_auto_loop</code>
      </p>
    </section>
  );
}