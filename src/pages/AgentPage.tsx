import { useNavigate, useOutletContext } from 'react-router-dom';
import { AgentConsole } from '../components/AgentConsole';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { AutoAgentPanel } from '../components/AutoAgentPanel';
import { CasePageShell } from '../components/case/CasePageShell';
import { PlatformCommandCenter } from '../components/PlatformCommandCenter';
import { AutoLoopPanel } from '../components/AutoLoopPanel';
import { LoopLedgerPanel } from '../components/LoopLedgerPanel';
import { MemoryLanePanel } from '../components/MemoryLanePanel';
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
      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.01}>
        <AutoAgentPanel caseId={caseData.id} onComplete={reload} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.02}>
        <PlatformCommandCenter compact />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.03}>
        <AutoLoopPanel caseId={caseData.id} hasResults={hasResults} onLoopComplete={reload} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.04}>
        <MemoryLanePanel caseId={caseData.id} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.05}>
        <AgentConsole caseData={caseData} onApplyPlan={applyPlan} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4" delay={0.08}>
        <LoopLedgerPanel caseId={caseData.id} />
      </ArcadeMotionCard>
    </CasePageShell>
  );
}