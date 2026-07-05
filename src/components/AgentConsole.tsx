import { useState } from 'react';
import { api, type AgentLoopResult, type CaseRecord } from '../api/memgateqaApi';
import { AgentWorkspace } from './AgentWorkspace';
import { useToast } from './Toast';

interface AgentConsoleProps {
  caseData: CaseRecord;
  onApplyPlan?: (plan: string) => void;
}

const LOOP_STEPS = ['observe', 'recall', 'grade', 'plan', 'verify'] as const;

export function AgentConsole({ caseData, onApplyPlan }: AgentConsoleProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [loopResult, setLoopResult] = useState<AgentLoopResult | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;

  const runStep = async (stepId: string) => {
    if (busy) return;
    setActiveStep(stepId);
    setBusy(true);
    try {
      const res = await api.agentLoop(caseData.id, stepId);
      setLoopResult(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Loop step failed', 'error');
    } finally {
      setBusy(false);
      setActiveStep(null);
    }
  };

  const runGapFill = async () => {
    if (busy || failures === 0) return;
    setBusy(true);
    try {
      const res = await api.agentGapFill(caseData.id);
      onApplyPlan?.(res.plan);
      toast('Repair plan generated — review in surgery', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gap-fill failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="agent-console">
      <div className="agent-console-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-purple-300">Memory QA agent</p>
          <h3 className="font-sig text-lg font-bold text-white">Cognee recall + LLM orchestration</h3>
          <p className="mt-1 text-sm text-slate-400">
            Health {caseData.lastScore ?? '—'}% · {failures} open failures · human gate on all mutations
          </p>
        </div>
        <button
          className="ent-btn ent-btn-primary ent-btn-sm"
          disabled={busy || failures === 0}
          onClick={runGapFill}
          type="button"
        >
          Generate repair plan
        </button>
      </div>

      <div className="agent-loop-bar">
        <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Loop tick</p>
        <div className="agent-loop-steps">
          {LOOP_STEPS.map((step) => (
            <button
              key={step}
              className={`agent-loop-btn ${activeStep === step ? 'active' : ''} ${loopResult?.step.id === step ? 'done' : ''}`}
              disabled={busy || !hasResults}
              onClick={() => runStep(step)}
              type="button"
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      <AgentWorkspace caseData={caseData} showModelSettings={false} />
    </section>
  );
}