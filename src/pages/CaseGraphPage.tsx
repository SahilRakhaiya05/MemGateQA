import { useMemo, useState } from 'react';
import { CasePageShell } from '../components/case/CasePageShell';
import { MemoryGraph3D } from '../components/MemoryGraph3D';
import { MemoryGraphPanel } from '../components/MemoryGraphPanel';
import { SchemaInventoryStrip } from '../components/SchemaInventoryStrip';
import { TrapDepositionBoard } from '../components/TrapDepositionBoard';
import { useCaseWorkspace } from '../context/CaseWorkspaceContext';

export function CaseGraphPage() {
  const { caseData } = useCaseWorkspace();
  const [mode, setMode] = useState<'2d' | '3d' | 'witnesses'>('2d');

  const failedEvidenceIds = useMemo(() => {
    const before = caseData.resultsBefore ?? [];
    return (caseData.tests ?? [])
      .filter((t) => before.some((r) => r.testId === t.id && r.status === 'fail'))
      .flatMap((t) => t.evidenceIds ?? []);
  }, [caseData]);

  return (
    <CasePageShell>
      <section className="case-station-panel">
        <div className="case-station-panel-head">
          <div className="memory-arena-tabs compact">
            {(['2d', '3d', 'witnesses'] as const).map((m) => (
              <button
                key={m}
                className={`memory-arena-tab ${mode === m ? 'active' : ''}`}
                onClick={() => setMode(m)}
                type="button"
              >
                {m === '3d' ? '3D' : m === '2d' ? '2D map' : 'Witnesses'}
              </button>
            ))}
          </div>
        </div>
        <SchemaInventoryStrip caseId={caseData.id} />
        {mode === '2d' ? (
          <MemoryGraphPanel
            caseId={caseData.id}
            caseName={caseData.agent ?? caseData.name}
            evidence={caseData.evidence}
            failedEvidenceIds={failedEvidenceIds}
            height={560}
            highlightFail={failedEvidenceIds.length > 0}
            tests={caseData.tests}
          />
        ) : null}
        {mode === '3d' ? (
          <MemoryGraph3D
            caseId={caseData.id}
            caseName={caseData.agent ?? caseData.name}
            evidence={caseData.evidence}
            failedEvidenceIds={failedEvidenceIds}
            height={560}
            highlightFail={failedEvidenceIds.length > 0}
            tests={caseData.tests}
          />
        ) : null}
        {mode === 'witnesses' ? <TrapDepositionBoard caseId={caseData.id} /> : null}
      </section>
    </CasePageShell>
  );
}