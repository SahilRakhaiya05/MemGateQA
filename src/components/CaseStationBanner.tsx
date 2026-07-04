import { useLocation } from 'react-router-dom';
import { CASE_STATIONS } from './case/caseStations';

export function CaseStationBanner() {
  const location = useLocation();
  const station = CASE_STATIONS.find((s) => {
    if (!s.path) return location.pathname.match(/\/cases\/[^/]+\/?$/);
    return location.pathname.endsWith(`/${s.path}`);
  });

  if (!station || station.id === 'overview') return null;

  return (
    <div className="case-station-banner">
      <span className="case-station-banner-icon">{station.icon}</span>
      <div>
        <p className="case-station-banner-step">
          Step {station.pipelineStep} · {station.cogneeOp ? `${station.cogneeOp}()` : 'Review'}
        </p>
        <h2 className="case-station-banner-title">{station.title}</h2>
        <p className="case-station-banner-sub">{station.subtitle}</p>
      </div>
    </div>
  );
}