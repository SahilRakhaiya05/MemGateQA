import { Link, useOutletContext, useParams } from 'react-router-dom';
import { LifecycleRunner } from '../components/LifecycleRunner';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { ScoreArcBanner } from '../components/ScoreArcBanner';
import { computeNextStep } from '../components/case/caseNextStep';
import { getGatePhase, gatePhaseLabel } from '../lib/gateStatus';
import type { CaseOutletContext } from './CaseLayout';

export function CaseOverviewPage() {
  const { caseData } = useOutletContext<CaseOutletContext>();
  const { caseId } = useParams();
  const isReferenceCase = caseId === 'case-wolfpack';
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;
  const phase = getGatePhase(caseData.lastScore, hasResults);
  const next = computeNextStep(caseData, `/cases/${caseId}`);

  return (
    <CasePageShell>
      {isReferenceCase ? (
        <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.01}>
          <LifecycleRunner />
        </ArcadeMotionCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ArcadeMotionCard className="ent-card p-6" delay={0.02}>
          <p className="font-hud text-[9px] uppercase tracking-wider text-cyan-300">Purpose</p>
          <h2 className="font-sig text-lg font-bold text-white">What this audit does</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {caseData.description ||
              'Test whether Cognee agent memory is fresh, grounded, private, and safe before production.'}
          </p>

          {next ? (
            <Link className="case-overview-next mt-5" to={next.path}>
              <span className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Next step</span>
              <span className="case-overview-next-title">{next.label}</span>
              <span className="case-overview-next-hint">{next.hint}</span>
            </Link>
          ) : (
            <p className="mt-5 text-sm text-emerald-300">Audit complete — view the certificate in Proof.</p>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Evidence" value={String(caseData.evidence.length)} />
            <Stat label="Trap tests" value={String(caseData.tests.length)} />
            <Stat label="Failures" value={String((caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length)} />
            <Stat label="Gate" value={gatePhaseLabel(phase)} />
          </dl>
        </ArcadeMotionCard>

        <ArcadeMotionCard className="ent-card p-6" delay={0.05}>
          {caseData.lastScore != null ? (
            <div className="space-y-4">
              <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Memory health</p>
              <ScoreArcBanner score={caseData.lastScore} />
              {phase === 'blocked' ? (
                <p className="text-sm text-amber-200/90">
                  Gate blocked — approve repair on the Repair tab, then rerun traps.
                </p>
              ) : null}
              <Link className="ent-btn ent-btn-primary inline-block" to={`/cases/${caseId}/report`}>
                View certificate
              </Link>
            </div>
          ) : (
            <div className="ent-empty py-8">
              <p className="font-sig text-lg text-slate-300">No score yet</p>
              <p className="mt-2 text-sm text-slate-500">Index evidence, then run trap tests on the Tests tab.</p>
              <Link className="ent-btn ent-btn-primary mt-4 inline-block" to={`/cases/${caseId}/tests`}>
                Go to tests
              </Link>
            </div>
          )}
        </ArcadeMotionCard>
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