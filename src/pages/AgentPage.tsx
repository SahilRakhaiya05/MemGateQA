import { useNavigate } from 'react-router-dom';
import { AgentConsole } from '../components/AgentConsole';
import { AutoAgentPanel } from '../components/AutoAgentPanel';
import { AutoLoopPanel } from '../components/AutoLoopPanel';
import { ArcadeMotionCard } from '../components/arcade/ArcadeMotionCard';
import { CasePageShell } from '../components/case/CasePageShell';
import { LoopLedgerPanel } from '../components/LoopLedgerPanel';
import { MemoryLanePanel } from '../components/MemoryLanePanel';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

/** Advanced automation — optional; main audit runs from Overview. */
export function AgentPage() {
  const { caseData, reload } = useCaseWorkspace();
  const navigate = useNavigate();
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;

  const applyPlan = (plan: string) => {
    navigate(`/cases/${caseData.id}/surgery`, { state: { plan } });
    reload();
  };

  return (
    <CasePageShell>
      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0}>
        <p className="font-hud text-[10px] uppercase tracking-wider text-slate-500">Advanced</p>
        <h2 className="font-sig text-lg font-bold text-white">Automation & AI assistant</h2>
        <p className="mt-1 text-sm text-slate-400">
          Scheduler, chat, and loop ticks. For most users, run <strong className="text-white">Run memory audit</strong>{' '}
          on the Overview tab — it uses Cognee + your LLM automatically.
        </p>
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.015}>
        <AutoAgentPanel caseId={caseData.id} onComplete={reload} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.02}>
        <AutoLoopPanel caseId={caseData.id} hasResults={hasResults} onLoopComplete={reload} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.03}>
        <MemoryLanePanel caseId={caseData.id} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4 mb-4" delay={0.05}>
        <AgentConsole caseData={caseData} onApplyPlan={applyPlan} />
      </ArcadeMotionCard>

      <ArcadeMotionCard className="ent-card p-4" delay={0.07}>
        <LoopLedgerPanel caseId={caseData.id} />
      </ArcadeMotionCard>
    </CasePageShell>
  );
}