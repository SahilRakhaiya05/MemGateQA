import { Link } from 'react-router-dom';
import type { CaseRecord } from '../../api/memgateqaApi';

interface CaseHealthStripProps {
  caseData: CaseRecord;
  caseId: string;
}

export function CaseHealthStrip({ caseData, caseId }: CaseHealthStripProps) {
  const score = caseData.lastScore ?? null;
  const shipReady = (score ?? 0) >= 80;
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const dataIds = caseData.cogneeDataIds ?? {};
  const indexed = caseData.evidence.filter((e) => dataIds[e.id]).length;
  const base = `/cases/${caseId}`;

  return (
    <div className="case-health-strip">
      <div className="case-health-strip-score">
        <span className="case-health-strip-kicker">Health</span>
        <strong className={shipReady ? 'text-emerald-400' : score != null ? 'text-amber-300' : 'text-slate-500'}>
          {score != null ? `${score}%` : '—'}
        </strong>
        <span className="case-health-strip-hint">
          {shipReady ? 'Ship clear' : failures ? `${failures} open traps` : 'Run audit'}
        </span>
      </div>
      <div className="case-health-strip-stat">
        <span className="case-health-strip-kicker">Memory</span>
        <strong>
          {indexed}/{caseData.evidence.length}
        </strong>
        <span className="case-health-strip-hint">indexed in Cognee</span>
      </div>
      <div className="case-health-strip-stat">
        <span className="case-health-strip-kicker">Traps</span>
        <strong>{caseData.tests.length}</strong>
        <span className="case-health-strip-hint">recall tests</span>
      </div>
      <div className="case-health-strip-actions">
        <Link className="case-health-strip-link" preventScrollReset to={`${base}/graph`}>
          Graph
        </Link>
        <Link className="case-health-strip-link" preventScrollReset to={`${base}/chat`}>
          Chat
        </Link>
        <Link className="case-health-strip-link" preventScrollReset to={`${base}/desk`}>
          Desk
        </Link>
        <Link className="case-health-strip-link" preventScrollReset to={`${base}/tests`}>
          Tests
        </Link>
        <Link className="case-health-strip-link" preventScrollReset to={`${base}/results`}>
          Results
        </Link>
        <Link className="case-health-strip-link" preventScrollReset to={base}>
          Workspace
        </Link>
      </div>
    </div>
  );
}