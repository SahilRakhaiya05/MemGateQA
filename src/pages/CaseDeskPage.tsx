import { MemoryWikiHub } from '../components/MemoryWikiHub';
import { CasePageShell } from '../components/case/CasePageShell';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function CaseDeskPage() {
  const { caseData } = useCaseWorkspace();

  return (
    <CasePageShell>
      <section className="case-station-panel">
        <MemoryWikiHub caseId={caseData.id} />
      </section>
    </CasePageShell>
  );
}