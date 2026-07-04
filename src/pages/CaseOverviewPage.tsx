import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { GuidedTour } from '../components/GuidedTour';
import { LifecycleRunner } from '../components/LifecycleRunner';
import { WorkflowChips } from '../components/WorkflowChips';
import { MemoryGraphPanel } from '../components/MemoryGraphPanel';
import { ComplianceRadar } from '../components/ComplianceRadar';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { ScoreArcBanner } from '../components/ScoreArcBanner';
import { WorkflowTimeline } from '../components/WorkflowTimeline';
import { CogneeProductFlow } from '../components/CogneeProductFlow';
import type { CaseOutletContext } from './CaseLayout';

export function CaseOverviewPage() {
  const { caseData } = useOutletContext<CaseOutletContext>();
  const { caseId } = useParams();
  const navigate = useNavigate();

  const isReferenceCase = caseId === 'case-wolfpack';

  return (
    <CasePageShell>
      {isReferenceCase ? (
        <div className="space-y-4 mb-6">
          <ArcadeMotionCard className="ent-card p-4" delay={0.01}>
            <CogneeProductFlow compact />
          </ArcadeMotionCard>
          <LifecycleRunner />
          <GuidedTour compact />
        </div>
      ) : (
        <ArcadeMotionCard className="ent-card p-4 mb-6" delay={0.01}>
          <CogneeProductFlow compact />
        </ArcadeMotionCard>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ArcadeMotionCard className="ent-card p-6" delay={0.02}>
            <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Ship-gate dossier</p>
            <h2 className="font-sig text-lg font-bold text-white">Audit dossier</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{caseData.description || 'No description.'}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Evidence" value={String(caseData.evidence.length)} />
              <Stat label="Tests" value={String(caseData.tests.length)} />
              <Stat label="Pre-repair" value={String(caseData.resultsBefore?.length ?? 0)} />
              <Stat label="Post-repair" value={String(caseData.resultsAfter?.length ?? 0)} />
            </dl>
            <div className="mt-4">
              <WorkflowChips onNavigate={(tab) => navigate(`/cases/${caseId}/${tab}`)} />
            </div>
          </ArcadeMotionCard>

          <ArcadeMotionCard className="ent-card p-6" delay={0.1}>
            <h2 className="font-sig text-lg font-bold text-white">QA workflow</h2>
            <WorkflowTimeline
              caseId={caseId!}
              hasEvidence={caseData.evidence.length > 0}
              hasRepair={(caseData.resultsAfter?.length ?? 0) > 0}
              hasReport={(caseData.reports?.length ?? 0) > 0}
              hasResults={(caseData.resultsBefore?.length ?? 0) > 0}
              hasTests={caseData.tests.length > 0}
              status={caseData.status}
            />
          </ArcadeMotionCard>

        </div>

        <div className="space-y-6">
          {caseData.lastScore != null ? (
            <div className="space-y-4">
              <ScoreArcBanner score={caseData.lastScore} />
              {caseData.lastBreakdown ? (
                <div className="ent-card p-5">
                  <ComplianceRadar breakdown={caseData.lastBreakdown} />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="ent-empty">
              <p className="font-sig text-lg text-slate-300">Awaiting interrogation</p>
              <p className="mt-2 text-sm text-slate-500">Run trap tests to compute Memory Health Score</p>
              <Link className="ent-btn ent-btn-primary mt-4 inline-block" to={`/cases/${caseId}/tests`}>
                Run tests
              </Link>
            </div>
          )}

          <MemoryGraphPanel caseId={caseData.id} highlightFail={caseData.status === 'tested'} />
        </div>
      </div>
    </CasePageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <dt className="font-hud text-[10px] uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-white">{value}</dd>
    </div>
  );
}