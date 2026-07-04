import { useState } from 'react';
import { api, type AgentLoopResult, type CaseRecord } from '../api/memgateqaApi';
import { useToast } from './Toast';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  meta?: string;
}

interface AgentConsoleProps {
  caseData: CaseRecord;
  onApplyPlan?: (plan: string) => void;
}

const LOOP_STEPS = ['observe', 'recall', 'grade', 'plan', 'verify'] as const;

const PROMPTS = [
  'Summarize memory health and biggest risks',
  'Which traps failed and why?',
  'Draft a human-approved surgery plan',
  'Compare RAG vs graph weaknesses',
];

export function AgentConsole({ caseData, onApplyPlan }: AgentConsoleProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'agent',
      text: `QA agent online for ${caseData.name}. MemGate Memory Engine (hybrid local + Cognee) + loop ticks. Human gate on all mutations.`,
      meta: 'MemGateQA · native memory + loop engineering',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loopResult, setLoopResult] = useState<AgentLoopResult | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const res = await api.agentChat(caseData.id, message);
      setMessages((m) => [
        ...m,
        {
          role: 'agent',
          text: res.answer,
          meta: res.provider ? `${res.provider} · ${res.model ?? ''}` : undefined,
        },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Agent request failed';
      toast(errMsg, 'error');
      setMessages((m) => [...m, { role: 'agent', text: errMsg }]);
    } finally {
      setBusy(false);
    }
  };

  const runStep = async (stepId: string) => {
    if (busy) return;
    setActiveStep(stepId);
    setBusy(true);
    try {
      const res = await api.agentLoop(caseData.id, stepId);
      setLoopResult(res);
      setMessages((m) => [
        ...m,
        {
          role: 'agent',
          text: res.detail,
          meta: `Loop · ${res.step.label} (${res.step.op})`,
        },
      ]);
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
      setMessages((m) => [
        ...m,
        {
          role: 'agent',
          text: res.plan,
          meta: res.provider ? `Gap-fill · ${res.provider}` : `Gap-fill · ${res.failureCount} failures`,
        },
      ]);
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

      <div className="agent-quick-prompts">
        {PROMPTS.map((p) => (
          <button
            key={p}
            className="agent-prompt-chip"
            disabled={busy}
            onClick={() => send(p)}
            type="button"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="agent-chat-log">
        {messages.map((msg, i) => (
          <div key={i} className={`agent-chat-bubble ${msg.role}`}>
            <p className="agent-chat-text">{msg.text}</p>
            {msg.meta ? <p className="agent-chat-meta">{msg.meta}</p> : null}
          </div>
        ))}
        {busy ? <p className="agent-chat-thinking">Agent thinking…</p> : null}
      </div>

      <form
        className="agent-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="ent-input"
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about traps, contradictions, or repair strategy…"
          value={input}
        />
        <button className="ent-btn ent-btn-primary" disabled={busy || !input.trim()} type="submit">
          Send
        </button>
      </form>
    </section>
  );
}