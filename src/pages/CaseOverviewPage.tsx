import { Link, useOutletContext, useParams } from 'react-router-dom';
import { LifecycleRunner } from '../components/LifecycleRunner';
import { computeNextStep } from '../components/case/caseNextStep';
import type { CaseOutletContext } from './CaseLayout';

/** Overview = WolfPack GO button + jump to next step. Arena + flow bar live in CaseLayout. */
export function CaseOverviewPage() {
  const { caseData } = useOutletContext<CaseOutletContext>();
  const { caseId } = useParams();
  const isWolfpack = caseId === 'case-wolfpack';
  const next = computeNextStep(caseData, `/cases/${caseId}`);

  return (
    <div className="case-overview-simple">
      {isWolfpack ? (
        <section className="ent-card p-4">
          <h2 className="font-sig text-lg font-bold text-white">Run the full demo</h2>
          <p className="mt-1 text-sm text-slate-400">One GO button — watch the queue, verifiers, and score change.</p>
          <div className="mt-4">
            <LifecycleRunner />
          </div>
        </section>
      ) : null}

      {next ? (
        <Link className="case-overview-cta" to={next.path}>
          <span className="case-overview-cta-label">Continue</span>
          <span className="case-overview-cta-title">{next.label}</span>
          <span className="case-overview-cta-hint">{next.hint}</span>
          <span className="case-overview-cta-arrow">→</span>
        </Link>
      ) : (
        <div className="ent-card p-6 text-center">
          <p className="font-sig text-xl text-emerald-300">Ship clear</p>
          <Link className="ent-btn ent-btn-primary mt-4 inline-block" to={`/cases/${caseId}/report`}>
            View certificate
          </Link>
        </div>
      )}
    </div>
  );
}