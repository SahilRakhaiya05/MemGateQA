import { useNavigate, useOutletContext } from 'react-router-dom';
import { AgentConsole } from '../components/AgentConsole';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { IntegrationsHub } from '../components/IntegrationsHub';
import type { CaseOutletContext } from './CaseLayout';

export function AgentPage() {
  const { caseData, reload } = useOutletContext<CaseOutletContext>();
  const navigate = useNavigate();
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;

  const applyPlan = (plan: string) => {
    navigate(`/cases/${caseData.id}/surgery`, { state: { plan } });
    reload();
  };

  return (
    <CasePageShell>
      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.02}>
        <IntegrationsHub compact />
      </ArcadeMotionCard>

      {!hasResults ? (
        <div className="ent-empty">
          <p className="font-sig text-lg font-bold text-white">Run interrogation first</p>
          <p className="mt-2 text-sm text-slate-400">
            The QA agent needs trap results before loop ticks and gap-fill plans.
          </p>
        </div>
      ) : (
        <ArcadeMotionCard className="ent-card p-4" delay={0.05}>
          <AgentConsole caseData={caseData} onApplyPlan={applyPlan} />
        </ArcadeMotionCard>
      )}
    </CasePageShell>
  );
}