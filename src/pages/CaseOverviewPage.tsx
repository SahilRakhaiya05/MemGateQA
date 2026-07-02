import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ComplianceGates } from '../components/enterprise/ComplianceGates';
import { DemoChips } from '../components/DemoChips';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { MemoryGraphPanel } from '../components/MemoryGraphPanel';
import type { CaseOutletContext } from './CaseLayout';

const steps = [
  { key: 'evidence', label: '1. Evidence intake', path: 'evidence' },
  { key: 'remember', label: '2. remember() → Cognee', path: 'evidence' },
  { key: 'tests', label: '3. Define trap tests', path: 'tests' },
  { key: 'interrogate', label: '4. recall() interrogation', path: 'tests' },
  { key: 'surgery', label: '5. Repair (forget + improve)', path: 'surgery' },
  { key: 'report', label: '6. Export ship proof', path: 'report' },
];

export function CaseOverviewPage() {
  const { caseData } = useOutletContext<CaseOutletContext>();
  const { caseId } = useParams();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="ent-card p-6">
          <h2 className="font-sig text-lg font-bold text-white">Audit dossier</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{caseData.description || 'No description.'}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Evidence" value={String(caseData.evidence.length)} />
            <Stat label="Tests" value={String(caseData.tests.length)} />
            <Stat label="Pre-repair results" value={String(caseData.resultsBefore?.length ?? 0)} />
            <Stat label="Post-repair results" value={String(caseData.resultsAfter?.length ?? 0)} />
          </dl>
          <div className="mt-4">
            <DemoChips onNavigate={(tab) => window.location.assign(`/cases/${caseId}/${tab}`)} />
          </div>
        </div>

        <div className="ent-card p-6">
          <h2 className="font-sig text-lg font-bold text-white">QA workflow</h2>
          <ol className="mt-4 space-y-2">
            {steps.map((step) => (
              <li key={step.key}>
                <Link className="ent-step-link" to={`/cases/${caseId}/${step.path}`}>
                  {step.label}
                  <span className="text-cyan-400">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {caseData.lastBreakdown ? (
          <div className="ent-card p-6">
            <ComplianceGates breakdown={caseData.lastBreakdown} />
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        {caseData.lastScore != null ? (
          <div className="ent-card p-6 text-center">
            <h2 className="font-sig text-lg font-bold text-white">Memory Health Score</h2>
            <div className="mt-4 flex justify-center">
              <HealthScoreGauge breakdown={caseData.lastBreakdown} score={caseData.lastScore} size="lg" />
            </div>
            <p className="mt-4 text-sm text-slate-400">
              {(caseData.lastScore ?? 0) >= 80 ? 'Ship clear for production deploy.' : 'Deploy blocked — run repair first.'}
            </p>
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