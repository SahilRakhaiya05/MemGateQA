import { motion } from 'framer-motion';
import type { CaseRecord, TestResult } from '../api/memgateqaApi';

interface TrapBeforeAfterSplitProps {
  caseData: CaseRecord;
  compact?: boolean;
}

function pickResults(caseData: CaseRecord): { before: TestResult[]; after: TestResult[] } {
  const before = (caseData.resultsBefore ?? []).filter((r) => {
    const t = caseData.tests.find((x) => x.id === r.testId);
    return t && t.category !== 'decoy';
  });
  const after = (caseData.resultsAfter ?? []).filter((r) => {
    const t = caseData.tests.find((x) => x.id === r.testId);
    return t && t.category !== 'decoy';
  });
  return { before, after };
}

export function TrapBeforeAfterSplit({ caseData, compact }: TrapBeforeAfterSplitProps) {
  const { before, after } = pickResults(caseData);
  if (!before.length) return null;

  const afterResults = after.length ? after : before;
  const afterPass = afterResults.filter((r) => r.status === 'pass').length;
  const beforePass = before.filter((r) => r.status === 'pass').length;
  const delta = afterPass - beforePass;

  const rows = before.map((b) => {
    const test = caseData.tests.find((t) => t.id === b.testId);
    const a = after.find((x) => x.testId === b.testId);
    return { test, before: b, after: a };
  });

  return (
    <section className={`trap-before-after ${compact ? 'compact' : ''}`}>
      <div className="trap-before-after-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-cyan-300">Evidence split-screen</p>
          <h2 className="font-sig text-xl font-bold text-white md:text-2xl">Before repair → After repair</h2>
          <p className="mt-1 text-sm text-slate-400">
            Same traps, same Cognee Cloud — watch recall flip after improve() + forget().
          </p>
        </div>
        <div className="trap-before-after-scores">
          <ScorePill label="Before" pass={beforePass} total={before.length} />
          <span className="trap-before-after-arrow">→</span>
          <ScorePill accent label="After" pass={afterPass} total={before.length} />
          {delta > 0 ? (
            <span className="trap-before-after-delta">+{delta} traps cleared</span>
          ) : null}
        </div>
      </div>

      <div className="trap-before-after-grid">
        {rows.map(({ test, before: b, after: a }, i) => {
          const flipped = b.status === 'fail' && a?.status === 'pass';
          const headline = test?.category === 'privacy' || test?.category === 'forget';
          return (
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className={`trap-ba-row ${flipped ? 'flipped' : ''} ${headline ? 'wedge' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              key={b.testId}
              transition={{ delay: i * 0.04 }}
            >
              <div className="trap-ba-meta">
                <span className="trap-ba-title">{test?.title ?? b.testId}</span>
                <span className="trap-ba-cat">{test?.category}</span>
                {flipped ? <span className="trap-ba-flip-badge">FIXED</span> : null}
              </div>
              <div className="trap-ba-cols">
                <TrapCol label="Before" result={b} />
                <TrapCol accent label="After" result={a ?? b} />
              </div>
            </motion.article>
          );
        })}
      </div>

      {!compact ? (
        <p className="trap-before-after-foot text-xs text-slate-600">
          Reproduce: <code className="font-hud">npm run evidence</code> · Live scorecard in{' '}
          <code className="font-hud">docs/EVIDENCE.md</code>
        </p>
      ) : null}
    </section>
  );
}

function ScorePill({
  label,
  pass,
  total,
  accent,
}: {
  label: string;
  pass: number;
  total: number;
  accent?: boolean;
}) {
  const pct = total ? Math.round((pass / total) * 100) : 0;
  return (
    <div className={`trap-ba-score-pill ${accent ? 'accent' : ''}`}>
      <span className="trap-ba-score-label">{label}</span>
      <span className="trap-ba-score-val">{pct}%</span>
      <span className="trap-ba-score-sub">
        {pass}/{total} pass
      </span>
    </div>
  );
}

function TrapCol({ label, result, accent }: { label: string; result: TestResult; accent?: boolean }) {
  const pass = result.status === 'pass';
  const text = result.actual?.split('\n\nEvidence:')[0]?.slice(0, 140) ?? '—';
  return (
    <div className={`trap-ba-col ${accent ? 'accent' : ''} ${pass ? 'pass' : 'fail'}`}>
      <span className="trap-ba-col-label">{label}</span>
      <span className={`trap-ba-verdict ${pass ? 'pass' : 'fail'}`}>{pass ? 'PASS' : 'FAIL'}</span>
      <p className="trap-ba-text">{text}{text.length >= 140 ? '…' : ''}</p>
    </div>
  );
}