import { Link, useLocation, useParams } from 'react-router-dom';

const STEPS = [
  { path: '', icon: '📋', label: 'Overview' },
  { path: 'evidence', icon: '📥', label: 'Evidence' },
  { path: 'tests', icon: '🔍', label: 'Tests' },
  { path: 'results', icon: '⚖️', label: 'Results' },
  { path: 'surgery', icon: '🔧', label: 'Repair' },
  { path: 'report', icon: '📜', label: 'Proof' },
] as const;

export function FloatingDock() {
  const { caseId } = useParams();
  const location = useLocation();

  if (!caseId) return null;

  const base = `/cases/${caseId}`;

  return (
    <nav className="floating-dock">
      {STEPS.map((step) => {
        const href = step.path ? `${base}/${step.path}` : base;
        const active = step.path
          ? location.pathname.endsWith(`/${step.path}`)
          : location.pathname === base || location.pathname === `${base}/`;
        return (
          <Link key={step.path || 'overview'} className={`floating-dock-item ${active ? 'active' : ''}`} to={href}>
            <span className="floating-dock-icon">{step.icon}</span>
            <span className="floating-dock-label">{step.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}