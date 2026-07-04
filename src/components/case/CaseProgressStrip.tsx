import { Link, useLocation, useParams } from 'react-router-dom';
import { CASE_STATIONS } from './caseStations';
import { useCaseNav } from '../../context/CaseNavContext';

export function CaseProgressStrip() {
  const nav = useCaseNav();
  const { caseId } = useParams();
  const location = useLocation();
  if (!nav || !caseId) return null;

  const base = `/cases/${caseId}`;
  const doneCount = nav.completed.filter(Boolean).length;
  const pct = Math.round((doneCount / nav.completed.length) * 100);

  return (
    <div className="case-progress-strip">
      <div className="case-progress-meta">
        <span className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Pipeline</span>
        <span className="font-hud text-[10px] text-theme-accent">{pct}% complete</span>
        {nav.shipReady ? <span className="case-progress-ship">✓ Ship clear</span> : null}
      </div>
      <div className="case-progress-rail">
        <div className="case-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="case-progress-pills">
        {CASE_STATIONS.map((s, i) => {
          const href = s.path ? `${base}/${s.path}` : base;
          const active = s.path
            ? location.pathname.endsWith(`/${s.path}`)
            : location.pathname === base || location.pathname === `${base}/`;
          const done = nav.completed[i];
          return (
            <Link
              key={s.id}
              className={`case-progress-pill ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              to={href}
            >
              <span>{s.icon}</span>
              <span className="case-progress-pill-label">{s.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}