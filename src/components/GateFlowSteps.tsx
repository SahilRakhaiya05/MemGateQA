import { Link, useLocation, useParams } from 'react-router-dom';

export const GATE_FLOW_STEPS = [
  { id: 'evidence', step: 1, icon: '📥', label: 'Evidence', hint: 'Load docs → remember()', path: 'evidence' },
  { id: 'tests', step: 2, icon: '🔍', label: 'Traps', hint: 'Trap questions → recall()', path: 'tests' },
  { id: 'results', step: 3, icon: '⚖️', label: 'Failures', hint: 'Review what broke', path: 'results' },
  { id: 'surgery', step: 4, icon: '🔧', label: 'Repair', hint: 'improve() + forget()', path: 'surgery' },
  { id: 'report', step: 5, icon: '📜', label: 'Proof', hint: 'Health certificate', path: 'report' },
  { id: 'agent', step: 6, icon: '🤖', label: 'Agent', hint: 'RUN ALL · LLM · MCP · loop', path: 'agent' },
] as const;

interface GateFlowStepsProps {
  completed?: boolean[];
  compact?: boolean;
}

export function GateFlowSteps({ completed, compact }: GateFlowStepsProps) {
  const { caseId } = useParams();
  const location = useLocation();
  if (!caseId) return null;

  const base = `/cases/${caseId}`;
  const onOverview = location.pathname === base || location.pathname === `${base}/`;

  return (
    <nav className={`gate-flow-steps ${compact ? 'compact' : ''}`} aria-label="Memory gate workflow">
      {GATE_FLOW_STEPS.map((s, i) => {
        const href = `${base}/${s.path}`;
        const active = location.pathname.endsWith(`/${s.path}`);
        const done = completed?.[i];
        return (
          <Link
            key={s.id}
            className={`gate-flow-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}
            to={href}
          >
            <span className="gate-flow-step-num">{s.step}</span>
            <span className="gate-flow-step-icon">{s.icon}</span>
            <span className="gate-flow-step-label">{s.label}</span>
            {!compact ? <span className="gate-flow-step-hint">{s.hint}</span> : null}
            {done ? <span className="gate-flow-step-check">✓</span> : null}
          </Link>
        );
      })}
      {onOverview ? (
        <p className="gate-flow-overview-note font-hud text-[9px] uppercase tracking-wider text-slate-500">
          Pick a step above — or press GO on WolfPack demo
        </p>
      ) : null}
    </nav>
  );
}

export function GateFlowExplainer() {
  return (
    <div className="gate-flow-explainer">
      <p className="gate-flow-explainer-title">How it works — 6 steps</p>
      <div className="gate-flow-explainer-row">
        {GATE_FLOW_STEPS.map((s) => (
          <div key={s.id} className="gate-flow-explainer-step">
            <span className="gate-flow-explainer-icon">{s.icon}</span>
            <span className="gate-flow-explainer-label">{s.label}</span>
            <span className="gate-flow-explainer-hint">{s.hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}