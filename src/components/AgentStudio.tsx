import { type CaseRecord } from '../api/memgateqaApi';
import { AgentWorkspace } from './AgentWorkspace';
import { AutoMemoryAudit } from './AutoMemoryAudit';


interface AgentStudioProps {
  caseData: CaseRecord;
  onComplete?: () => void;
}

export function AgentStudio({ caseData, onComplete }: AgentStudioProps) {
  return (
    <section className="agent-studio space-y-4">
      <AgentWorkspace caseData={caseData} embedded />
      <AutoMemoryAudit caseData={caseData} onComplete={onComplete} />
    </section>
  );
}