import { AgentWorkspace } from '../components/AgentWorkspace';
import { AutoMemoryAudit } from '../components/AutoMemoryAudit';
import { CasePageShell } from '../components/case/CasePageShell';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function CaseChatPage() {
  const { caseData, reload } = useCaseWorkspace();

  return (
    <CasePageShell>
      <section className="case-station-panel case-chat-panel">
        <AgentWorkspace caseData={caseData} chatOnly />
      </section>
      <section className="case-station-panel case-chat-audit">
        <AutoMemoryAudit caseData={caseData} onComplete={reload} />
      </section>
    </CasePageShell>
  );
}