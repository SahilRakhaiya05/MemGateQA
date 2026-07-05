import { Link, useLocation, useParams } from 'react-router-dom';
import { CASE_STATIONS, type CaseStationDef } from './case/caseStations';
import { useCaseNav, type CaseNavSnapshot } from '../context/CaseNavContext';

function stationDone(step: CaseStationDef, nav: CaseNavSnapshot): boolean {
  const dataIds = nav.caseData.cogneeDataIds ?? {};
  const indexed = nav.caseData.evidence.filter((e) => dataIds[e.id]).length;
  const hasResults = (nav.caseData.resultsBefore?.length ?? 0) > 0;
  if (step.id === 'overview') return indexed > 0 || hasResults;
  if (step.id === 'graph') return indexed > 0;
  if (step.id === 'chat') return Boolean(nav.caseData.chatHistory?.length);
  if (step.id === 'desk') return nav.caseData.evidence.length > 0;
  if (step.id === 'evidence') return nav.caseData.evidence.length > 0 && indexed > 0;
  if (step.id === 'tests') return nav.caseData.tests.length > 0;
  if (step.id === 'results') return hasResults;
  if (step.id === 'surgery') return (nav.caseData.resultsAfter?.length ?? 0) > 0;
  if (step.id === 'report') return (nav.caseData.reports?.length ?? 0) > 0;
  if (step.id === 'agent') return nav.shipReady;
  return false;
}

export function FloatingDock() {
  const { caseId } = useParams();
  const location = useLocation();
  const nav = useCaseNav();

  if (!caseId) return null;

  const base = `/cases/${caseId}`;

  return (
    <nav className="floating-dock">
      {CASE_STATIONS.map((step) => {
        const href = step.path ? `${base}/${step.path}` : base;
        const active = step.path
          ? location.pathname.endsWith(`/${step.path}`)
          : location.pathname === base || location.pathname === `${base}/`;
        const done = nav ? stationDone(step, nav) : false;
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