import { motion } from 'framer-motion';
import type { CaseRecord, TestResult } from '../api/memgateqaApi';

interface SuspectWallProps {
  caseData: CaseRecord;
  results: TestResult[];
  onCompare?: (testId: string) => void;
  comparingId?: string | null;
}

const CATEGORY_ICON: Record<string, string> = {
  stale: '🕐',
  privacy: '🔒',
  forget: '🗑️',
  contradiction: '⚡',
  hallucination: '👻',
  false_premise: '🪤',
};

export function SuspectWall({ caseData, results, onCompare, comparingId }: SuspectWallProps) {
  const failed = results.filter((r) => r.status === 'fail');
  const passed = results.filter((r) => r.status === 'pass');

  if (!results.length) return null;

  return (
    <section className="suspect-wall">
      <div className="suspect-wall-header">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-amber-300">Interrogation room</p>
          <h2 className="font-sig text-2xl font-bold text-white">Suspect wall</h2>
          <p className="mt-1 text-sm text-slate-400">
            {failed.length} memory failures pinned · {passed.length} cleared · deposition-style contradiction board
          </p>
        </div>
        <div className="suspect-wall-stats">
          <div className="suspect-stat suspect-stat-fail">
            <span className="suspect-stat-num">{failed.length}</span>
            <span className="suspect-stat-label">Fails</span>
          </div>
          <div className="suspect-stat suspect-stat-pass">
            <span className="suspect-stat-num">{passed.length}</span>
            <span className="suspect-stat-label">Pass</span>
          </div>
        </div>
      </div>

      {failed.length ? (
        <div className="suspect-grid">
          {failed.map((result, idx) => {
            const test = caseData.tests.find((t) => t.id === result.testId);
            const icon = CATEGORY_ICON[test?.category ?? ''] ?? '❓';
            return (
              <motion.article
                key={result.testId}
                animate={{ opacity: 1, y: 0 }}
                className="suspect-card suspect-card-fail"
                initial={{ opacity: 0, y: 12 }}
                transition={{ delay: idx * 0.06 }}
              >
                <div className="suspect-card-pin" />
                <div className="suspect-card-head">
                  <span className="suspect-icon">{icon}</span>
                  <div>
                    <h3 className="font-sig text-base font-bold text-white">{test?.title ?? result.testId}</h3>
                    <p className="font-hud text-[10px] uppercase text-red-300">{test?.category ?? 'trap'} · FAIL</p>
                  </div>
                </div>
                <div className="suspect-split">
                  <div className="suspect-expected">
                    <span className="suspect-label">Ground truth</span>
                    <p>{test?.expected}</p>
                  </div>
                  <div className="suspect-actual">
                    <span className="suspect-label">Cognee recall</span>
                    <p>{result.actual}</p>
                  </div>
                </div>
                <p className="suspect-reason">{result.reason}</p>
                {onCompare ? (
                  <button
                    className="ent-btn ent-btn-ghost ent-btn-sm mt-3 w-full"
                    disabled={comparingId === result.testId}
                    onClick={() => onCompare(result.testId)}
                    type="button"
                  >
                    {comparingId === result.testId ? 'Comparing…' : 'RAG vs Graph compare'}
                  </button>
                ) : null}
              </motion.article>
            );
          })}
        </div>
      ) : (
        <div className="suspect-cleared">
          <span className="case-stamp">Memory cleared</span>
          <p className="mt-4 text-sm text-slate-400">All trap tests passed. Ready for deploy gate.</p>
        </div>
      )}

      {passed.length ? (
        <details className="suspect-passed-details">
          <summary className="cursor-pointer font-hud text-xs uppercase tracking-wider text-emerald-300">
            {passed.length} cleared tests
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {passed.map((result) => {
              const test = caseData.tests.find((t) => t.id === result.testId);
              return (
                <div key={result.testId} className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-100">
                  ✓ {test?.title ?? result.testId}
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </section>
  );
}