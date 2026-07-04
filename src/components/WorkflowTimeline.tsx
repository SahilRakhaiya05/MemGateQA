import { Link } from 'react-router-dom';

interface Step {
  key: string;
  label: string;
  path: string;
  icon: string;
  done: boolean;
  active: boolean;
}

interface WorkflowTimelineProps {
  caseId: string;
  status: string;
  hasEvidence: boolean;
  hasTests: boolean;
  hasResults: boolean;
  hasRepair: boolean;
  hasReport: boolean;
}

export function WorkflowTimeline({
  caseId,
  status,
  hasEvidence,
  hasTests,
  hasResults,
  hasRepair,
  hasReport,
}: WorkflowTimelineProps) {
  const steps: Step[] = [
    { key: 'evidence', label: 'Evidence', path: 'evidence', icon: '📥', done: hasEvidence, active: status === 'open' || status === 'intake' },
    { key: 'tests', label: 'Trap tests', path: 'tests', icon: '🔍', done: hasTests, active: status === 'intake' },
    { key: 'results', label: 'Interrogate', path: 'results', icon: '⚖️', done: hasResults, active: status === 'tested' },
    { key: 'surgery', label: 'Repair', path: 'surgery', icon: '🔧', done: hasRepair, active: status === 'surgery' },
    { key: 'report', label: 'Certificate', path: 'report', icon: '📋', done: hasReport, active: status === 'repaired' || status === 'closed' },
  ];

  return (
    <div className="workflow-timeline">
      {steps.map((step, i) => (
        <Link
          key={step.key}
          className={`workflow-node ${step.done ? 'done' : ''} ${step.active ? 'active' : ''}`}
          to={`/cases/${caseId}/${step.path}`}
        >
          <span className="workflow-icon">{step.icon}</span>
          <span className="workflow-label">{step.label}</span>
          {step.done ? <span className="workflow-check">✓</span> : null}
          {i < steps.length - 1 ? <div className="workflow-connector" /> : null}
        </Link>
      ))}
    </div>
  );
}