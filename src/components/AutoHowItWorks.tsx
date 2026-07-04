import { useState } from 'react';
import { api } from '../api/memgateqaApi';
import { useToast } from './Toast';

const STEPS = [
  { id: 'sync', label: 'Sync memory', detail: 'Index evidence into MemGate + Cognee remember()' },
  { id: 'audit', label: 'Auto audit', detail: 'Run trap recall() + grade failures' },
  { id: 'repair', label: 'Auto repair', detail: 'Human-approved improve() + forget() when score < 80%' },
  { id: 'loop', label: 'Auto scheduler', detail: 'Repeat observe→recall→grade until ship-ready ≥80%' },
] as const;

interface AutoHowItWorksProps {
  caseId?: string;
  onComplete?: () => void;
  compact?: boolean;
}

export function AutoHowItWorks({ caseId = 'case-wolfpack', onComplete, compact }: AutoHowItWorksProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const runAuto = async () => {
    setBusy(true);
    setActiveStep(0);
    try {
      for (let i = 0; i < STEPS.length; i++) {
        setActiveStep(i);
        await new Promise((r) => setTimeout(r, 400));
      }
      const res = await api.runAutoAgent(caseId, { startAutoLoop: false });
      toast(res.shipReady ? `Ship clear · ${res.health}%` : `Auto complete · ${res.health ?? '—'}%`, res.shipReady ? 'success' : 'info');
      onComplete?.();
      setActiveStep(STEPS.length);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Auto agent failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`auto-how-panel ${compact ? 'compact' : ''}`}>
      <div className="auto-how-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">How auto works</p>
          <h3 className="font-sig text-base font-bold text-white">One pipeline — memory sync to ship-ready</h3>
          {!compact ? (
            <p className="mt-1 text-sm text-slate-500">
              MCP <code className="font-hud text-xs">memgateqa_run_auto_agent</code> · CLI{' '}
              <code className="font-hud text-xs">npm run agent:run</code> · SDK{' '}
              <code className="font-hud text-xs">sdk.runAutoAgent()</code>
            </p>
          ) : null}
        </div>
        <button className="ent-btn ent-btn-primary ent-btn-sm" disabled={busy} onClick={runAuto} type="button">
          {busy ? 'Running…' : 'Run auto'}
        </button>
      </div>

      <ol className="auto-how-steps">
        {STEPS.map((step, i) => (
          <li
            key={step.id}
            className={`auto-how-step ${busy && activeStep === i ? 'active' : ''} ${!busy && activeStep > i ? 'done' : ''}`}
          >
            <span className="auto-how-num">{i + 1}</span>
            <div>
              <p className="auto-how-label">{step.label}</p>
              <p className="auto-how-detail">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}