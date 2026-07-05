import { Link, useLocation, useParams } from 'react-router-dom';
import { stationHref } from './caseStationRoute';
import { CASE_STATIONS, type CaseStationDef } from './caseStations';
import { useCaseNav, type CaseNavSnapshot } from '../../context/CaseNavContext';

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

export function CaseTabBar() {
  const { caseId } = useParams();
  const location = useLocation();
  const nav = useCaseNav();
  if (!caseId || !nav) return null;

  const base = `/cases/${caseId}`;
  const activeStation =
    CASE_STATIONS.find((s) =>
      s.path ? location.pathname.endsWith(`/${s.path}`) : location.pathname === base || location.pathname === `${base}/`,
    ) ?? CASE_STATIONS[0];

  return (
    <div className="case-tab-bar">
      <nav aria-label="Case sections" className="case-tab-bar-nav">
        {CASE_STATIONS.map((step) => {
          const href = stationHref(caseId, step.id);
          const active = step.id === activeStation.id;
          const done = stationDone(step, nav);
          return (
            <Link
              key={step.id}
              className={`case-tab-bar-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              preventScrollReset
              to={href}
            >
              <span className="case-tab-bar-icon">{step.icon}</span>
              <span className="case-tab-bar-label">{step.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="case-tab-bar-meta">
        <h2 className="case-tab-bar-title">{activeStation.title}</h2>
        <p className="case-tab-bar-sub">{activeStation.subtitle}</p>
      </div>
    </div>
  );
}