import { useState } from 'react';
import { api, type FleetAutoAgentResult } from '../api/memgateqaApi';
import { useToast } from './Toast';

interface FleetAutoPanelProps {
  onComplete?: () => void;
}

export function FleetAutoPanel({ onComplete }: FleetAutoPanelProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FleetAutoAgentResult | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.runFleetAutoAgent();
      setResult(res);
      toast(`Fleet auto agent · ${res.shipReady}/${res.ran} ship-ready`, res.shipReady === res.ran ? 'success' : 'info');
      onComplete?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Fleet auto agent failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="fleet-auto-panel">
      <div>
        <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">Fleet auto agent</p>
        <p className="font-sig text-base font-bold text-white">Run autonomous pipeline on all audits with tests</p>
        {result ? (
          <p className="mt-1 text-sm text-slate-400">
            {result.ran} cases · {result.shipReady} ship-clear
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Memory sync → audit → repair → scheduler per case</p>
        )}
      </div>
      <button className="ent-btn ent-btn-primary" disabled={busy} onClick={run} type="button">
        {busy ? 'Running fleet…' : 'Run fleet auto'}
      </button>
    </section>
  );
}