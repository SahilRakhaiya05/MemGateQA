import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HealthScoreGauge } from '../components/HealthScoreGauge';
import { MemoryGraphPanel } from '../components/MemoryGraphPanel';
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          {label ? <p className="mb-2 font-hud text-xs uppercase tracking-wider text-cyan-300">{label}</p> : null}
          <p className="text-sm text-slate-400">
            {failed} failures · Graph vs RAG compare available per test
          </p>
        </div>
        <HealthScoreGauge breakdown={caseData.lastBreakdown} score={score} size="sm" />
      </div>

      <MemoryGraphPanel caseId={caseData.id} highlightFail={failed > 0} />

      <div className="grid gap-4">
        {active.map((result) => {
          const test = caseData.tests.find((t) => t.id === result.testId);
          const failedTest = result.status === 'fail';
          return (
            <div
              key={result.testId}
              className={`rounded-2xl border p-5 ${failedTest ? 'border-red-400/30 bg-red-400/5' : 'border-emerald-400/30 bg-emerald-400/5'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white">{test?.title ?? result.testId}</span>
                <div className="flex items-center gap-2">
                  {failedTest ? (
                    <button
                      className="rounded-lg border border-cyan-400/30 px-3 py-1 font-hud text-[10px] uppercase text-cyan-200 hover:bg-cyan-400/10"
                      disabled={comparing}
                      onClick={() => runCompare(result.testId)}
                      type="button"
                    >
                      {comparing && compareId === result.testId ? 'Comparing…' : 'RAG vs Graph'}
                    </button>
                  ) : null}
                  <span className={`font-hud text-xs font-bold uppercase ${failedTest ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                  <div className="font-hud text-[10px] uppercase text-emerald-300">Expected</div>
                  <p className="mt-1 text-sm text-white">{test?.expected}</p>
                </div>
                <div className={`rounded-xl border p-3 ${failedTest ? 'border-red-400/30 bg-red-400/10' : 'border-white/10 bg-black/20'}`}>
                  <div className="font-hud text-[10px] uppercase text-slate-400">Cognee recall</div>
                  <p className={`mt-1 text-sm font-medium ${failedTest ? 'text-red-200' : 'text-white'}`}>{result.actual}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">{result.reason}</p>

              {compare && compareId === result.testId ? (
                <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-orange-400/25 bg-orange-400/5 p-3">
                    <div className="font-hud text-[10px] uppercase text-orange-300">Plain RAG recall</div>
                    <p className="mt-1 text-xs text-slate-300">{compare.rag.answer.slice(0, 400)}</p>
                    <span className={`mt-2 inline-block font-hud text-[10px] ${compare.rag.grade.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compare.rag.grade.status}
                    </span>
                  </div>
                  <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-3">
                    <div className="font-hud text-[10px] uppercase text-cyan-300">Graph recall (Cognee)</div>
                    <p className="mt-1 text-xs text-slate-300">{compare.graph.answer.slice(0, 400)}</p>
                    <span className={`mt-2 inline-block font-hud text-[10px] ${compare.graph.grade.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compare.graph.grade.status}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}