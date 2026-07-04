import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { MemoryGraphPanel } from '../components/MemoryGraphPanel';
import { RagGraphCompare } from '../components/RagGraphCompare';
import { SuspectWall } from '../components/SuspectWall';
import { api } from '../api/memgateqaApi';
import type { CaseOutletContext } from './CaseLayout';

export function ResultsPage() {
  const { caseData } = useOutletContext<CaseOutletContext>();
  const before = caseData.resultsBefore ?? [];
  const after = caseData.resultsAfter ?? [];
  const active = after.length ? after : before;
  const label = after.length ? 'After surgery' : before.length ? 'Before surgery' : null;
  const [compareId, setCompareId] = useState<string | null>(null);
  const [compare, setCompare] = useState<Awaited<ReturnType<typeof api.compare>> | null>(null);
  const [comparing, setComparing] = useState(false);

  const runCompare = async (testId: string) => {
    setComparing(true);
    setCompareId(testId);
    try {
      const res = await api.compare(caseData.id, testId);
      setCompare(res);
    } catch {
      setCompare(null);
    } finally {
      setComparing(false);
    }
  };

  if (!active.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center text-slate-400">
        No interrogation results yet. Add tests and run interrogation first.
      </div>
    );
  }

  const failed = active.filter((r) => r.status === 'fail').length;
  const score = caseData.lastScore ?? 0;
  const compareTest = compareId ? caseData.tests.find((t) => t.id === compareId) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          {label ? <p className="mb-2 font-hud text-xs uppercase tracking-wider text-cyan-300">{label}</p> : null}
          <p className="text-sm text-slate-400">
            {failed} failures pinned on suspect wall · 3-column RAG vs Graph compare per test
          </p>
        </div>
        <HealthScoreGauge breakdown={caseData.lastBreakdown} score={score} size="sm" />
      </div>

      <SuspectWall
        caseData={caseData}
        comparingId={comparing ? compareId : null}
        onCompare={runCompare}
        results={active}
      />

      {compare && compareTest ? (
        <RagGraphCompare
          expected={compareTest.expected}
          graph={compare.graph}
          rag={compare.rag}
          testTitle={compareTest.title}
        />
      ) : null}

      <MemoryGraphPanel caseId={caseData.id} highlightFail={failed > 0} />
    </div>
  );
}