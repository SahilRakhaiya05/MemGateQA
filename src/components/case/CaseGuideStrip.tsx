import { Link, useLocation } from 'react-router-dom';
import type { CaseRecord } from '../../api/memgateqaApi';
import { computeCaseGuide } from './caseNextStep';

interface CaseGuideStripProps {
  caseData: CaseRecord;
  compact?: boolean;
}

export function CaseGuideStrip({ caseData, compact }: CaseGuideStripProps) {
  const location = useLocation();
  const guide = computeCaseGuide(caseData, location.pathname);
  const onActionPath = location.pathname === guide.actionPath;

  return (
    <section className={`case-guide-strip tone-${guide.tone} ${compact ? 'compact' : ''}`}>
      <div className="case-guide-strip-progress" aria-hidden>
        <span className="case-guide-strip-step">
          Step {guide.step}/{guide.totalSteps}
        </span>
        <span className="case-guide-strip-phase">{guide.phase}</span>
      </div>
      <div className="case-guide-strip-body">
        <h3 className="case-guide-strip-headline">{guide.headline}</h3>
        <p className="case-guide-strip-detail">{guide.detail}</p>
      </div>
      {!onActionPath ? (
        <Link className="case-guide-strip-action" preventScrollReset to={guide.actionPath}>
          {guide.actionLabel} →
        </Link>
      ) : (
        <span className="case-guide-strip-here font-hud text-[9px] uppercase tracking-wider text-slate-500">
          You are here
        </span>
      )}
    </section>
  );
}