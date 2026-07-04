import { Link, useLocation, useParams } from 'react-router-dom';
import { CASE_STATIONS } from './case/caseStations';
import { useCaseNav } from '../context/CaseNavContext';

export function FloatingDock() {
  const { caseId } = useParams();
  const location = useLocation();
  const nav = useCaseNav();

  if (!caseId) return null;

  const base = `/cases/${caseId}`;

  return (
    <nav className="floating-dock">
      {CASE_STATIONS.map((step, i) => {
        const href = step.path ? `${base}/${step.path}` : base;
        const active = step.path
          ? location.pathname.endsWith(`/${step.path}`)
          : location.pathname === base || location.pathname === `${base}/`;
        const done = nav?.completed[i];
        return (
          <Link key={step.id} className={`floating-dock-item ${active ? 'active' : ''} ${done ? 'done' : ''}`} to={href}>
            <span className="floating-dock-icon">{step.icon}</span>
            <span className="floating-dock-label">{step.label}</span>
            {done ? <span className="floating-dock-check">✓</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}