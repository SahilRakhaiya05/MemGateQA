import { Link } from 'react-router-dom';
import type { CaseRecord } from '../api/memgateqaApi';

interface MemoryRiskPanelProps {
  caseData: CaseRecord;
  compact?: boolean;
}

/** Wingman/Cognost-style contradiction alerts — MemGateQA way: open trap failures. */
export function MemoryRiskPanel({ caseData, compact }: MemoryRiskPanelProps) {
  const results = caseData.resultsAfter?.length ? caseData.resultsAfter : caseData.resultsBefore ?? [];
  const failures = results.filter((r) => r.status === 'fail');
  if (!failures.length) {
    return (
      <div className={`memory-risk-panel clear ${compact ? 'compact' : ''}`}>
        <span className="memory-risk-icon">✓</span>
        <p className="memory-risk-title">No open memory risks</p>
        {!compact ? <p className="memory-risk-sub">Trap suite passed or not run yet.</p> : null}
      </div>
    );
  }

  return (
    <div className={`memory-risk-panel warn ${compact ? 'compact' : ''}`}>
      <div className="memory-risk-head">
        <span className="memory-risk-icon">⚠</span>
        <div>
          <p className="memory-risk-title">{failures.length} memory risk{failures.length > 1 ? 's' : ''} detected</p>
          <p className="memory-risk-sub">
            Like Wingman contradictions — but proven by trap tests, not vibes.
          </p>
        </div>
        <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseData.id}/results`}>
          View traps
        </Link>
      </div>
      <ul className="memory-risk-list">
        {failures.slice(0, compact ? 3 : 6).map((f) => {
          const test = caseData.tests?.find((t) => t.id === f.testId);
          return (
            <li key={f.testId}>
              <span className="memory-risk-cat">{test?.category ?? 'trap'}</span>
              <span className="memory-risk-q">{test?.question ?? test?.title ?? f.testId}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}