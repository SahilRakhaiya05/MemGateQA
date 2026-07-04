import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, type CaseRecord, type CompareResult } from '../api/memgateqaApi';
import { GoButton } from './arcade/GoButton';

interface CompareArenaProps {
  caseData: CaseRecord;
  failedTestIds: string[];
}

interface ArenaSummary {
  graphWins: number;
  ragWins: number;
  ties: number;
  results: CompareResult[];
}

function summarize(results: CompareResult[]): ArenaSummary {
  let graphWins = 0;
  let ragWins = 0;
  let ties = 0;
  for (const r of results) {
    const gPass = r.graph.grade.status === 'pass';
    const rPass = r.rag.grade.status === 'pass';
    if (gPass && !rPass) graphWins++;
    else if (rPass && !gPass) ragWins++;
    else ties++;
  }
  return { graphWins, ragWins, ties, results };
}

/** Batch RAG vs Graph compare — prove Cognee graph wins on failed traps. */
export function CompareArena({ caseData, failedTestIds }: CompareArenaProps) {
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<ArenaSummary | null>(null);
  const [error, setError] = useState('');

  const runArena = async () => {
    if (!failedTestIds.length) return;
    setRunning(true);
    setError('');
    setSummary(null);
    try {
      const results: CompareResult[] = [];
      for (const testId of failedTestIds.slice(0, 8)) {
        const res = await api.compare(caseData.id, testId);
        results.push(res);
      }
      setSummary(summarize(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare arena failed');
    } finally {
      setRunning(false);
    }
  };

  if (!failedTestIds.length) return null;

  return (
    <section className="compare-arena">
      <div className="compare-arena-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Retrieval arena</p>
          <h2 className="font-sig text-xl font-bold text-white">RAG vs Graph</h2>
          <p className="mt-1 text-sm text-slate-400">
            Batch-compare {failedTestIds.length} failed traps — graph traversal vs vector RAG on Cognee Cloud.
          </p>
        </div>
        <GoButton disabled={running} label={running ? '…' : 'COMPARE ALL'} loading={running} onClick={runArena} />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {summary ? (
        <motion.div animate={{ opacity: 1 }} className="compare-arena-summary" initial={{ opacity: 0 }}>
          <div className="compare-arena-scores">
            <ScoreCard accent="cyan" label="Graph wins" value={summary.graphWins} winner={summary.graphWins >= summary.ragWins} />
            <ScoreCard accent="orange" label="RAG wins" value={summary.ragWins} winner={summary.ragWins > summary.graphWins} />
            <ScoreCard accent="slate" label="Tie / both fail" value={summary.ties} />
          </div>
          <p className="compare-arena-verdict font-hud text-[10px] uppercase tracking-wider">
            {summary.graphWins > summary.ragWins
              ? '✓ Graph traversal outperforms plain RAG on failed traps'
              : summary.ragWins > summary.graphWins
                ? '⚠ RAG matched graph — deepen graph cognify or improve()'
                : '— Mixed results — review per-trap compare below'}
          </p>
          <div className="compare-arena-rows">
            {summary.results.map((r) => {
              const test = caseData.tests.find((t) => t.id === r.testId);
              const graphPass = r.graph.grade.status === 'pass';
              const ragPass = r.rag.grade.status === 'pass';
              return (
                <div key={r.testId} className="compare-arena-row">
                  <span className="compare-arena-row-title">{test?.title ?? r.testId}</span>
                  <span className={graphPass ? 'text-emerald-400' : 'text-red-400'}>Graph {graphPass ? '✓' : '✗'}</span>
                  <span className={ragPass ? 'text-emerald-400' : 'text-red-400'}>RAG {ragPass ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </section>
  );
}

function ScoreCard({
  label,
  value,
  accent,
  winner,
}: {
  label: string;
  value: number;
  accent: string;
  winner?: boolean;
}) {
  return (
    <div className={`compare-arena-score compare-arena-score-${accent} ${winner ? 'winner' : ''}`}>
      <span className="compare-arena-score-val">{value}</span>
      <span className="compare-arena-score-label">{label}</span>
      {winner ? <span className="compare-arena-crown">👑</span> : null}
    </div>
  );
}