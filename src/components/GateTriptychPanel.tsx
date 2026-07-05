import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, type CaseRecord, type CompareResult } from '../api/memgateqaApi';
import { GoButton } from './arcade/GoButton';

const DEMO_TRAPS = ['test-stack', 'test-token-leak', 'test-forget-phone', 'test-abstain-deploy'];

interface GateTriptychPanelProps {
  caseData: CaseRecord;
}

/** Compare plain RAG, Cognee graph recall, and MemGateQA gated traps side by side. */
export function GateTriptychPanel({ caseData }: GateTriptychPanelProps) {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<(CompareResult & { gated: { status: string; answer: string } })[]>([]);

  const run = async () => {
    setRunning(true);
    setRows([]);
    try {
      const out: (CompareResult & { gated: { status: string; answer: string } })[] = [];
      for (const testId of DEMO_TRAPS) {
        const cmp = await api.compare(caseData.id, testId);
        const gated =
          caseData.resultsAfter?.find((r) => r.testId === testId) ??
          caseData.resultsBefore?.find((r) => r.testId === testId);
        out.push({
          ...cmp,
          gated: {
            status: gated?.status ?? 'fail',
            answer: gated?.actual?.split('\n\nEvidence:')[0]?.slice(0, 160) ?? '—',
          },
        });
      }
      setRows(out);
    } finally {
      setRunning(false);
    }
  };

  const ragWins = rows.filter((r) => r.rag.grade.status === 'pass').length;
  const graphWins = rows.filter((r) => r.graph.grade.status === 'pass').length;
  const gateWins = rows.filter((r) => r.gated.status === 'pass').length;

  return (
    <section className="gate-triptych">
      <div className="gate-triptych-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-orange-300">3-way retrieval arena</p>
          <h2 className="font-sig text-xl font-bold text-white">Plain RAG · Graph · MemGate gate</h2>
          <p className="mt-1 text-sm text-slate-400">
            Proves your QA layer adds value on top of Cognee — not just another recall demo.
          </p>
        </div>
        <GoButton disabled={running} label={running ? '…' : 'RUN TRIPTYCH'} loading={running} onClick={run} />
      </div>

      {rows.length > 0 ? (
        <motion.div animate={{ opacity: 1 }} className="gate-triptych-summary" initial={{ opacity: 0 }}>
          <TriptychScore accent="orange" label="RAG pass" value={ragWins} />
          <TriptychScore accent="cyan" label="Graph pass" value={graphWins} />
          <TriptychScore accent="emerald" highlight label="Gated pass" value={gateWins} />
        </motion.div>
      ) : null}

      {rows.map((r) => (
        <div className="gate-triptych-row" key={r.testId}>
          <p className="gate-triptych-test">{r.question?.slice(0, 64) ?? r.testId}</p>
          <div className="gate-triptych-cols">
            <MiniCol label="RAG" pass={r.rag.grade.status === 'pass'} text={r.rag.answer} />
            <MiniCol label="Graph" pass={r.graph.grade.status === 'pass'} text={r.graph.answer} />
            <MiniCol accent label="Gated" pass={r.gated.status === 'pass'} text={r.gated.answer} />
          </div>
        </div>
      ))}
    </section>
  );
}

function TriptychScore({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  accent: 'orange' | 'cyan' | 'emerald';
  highlight?: boolean;
}) {
  return (
    <div className={`gate-triptych-score ${accent} ${highlight ? 'highlight' : ''}`}>
      <span className="gate-triptych-score-val">{value}</span>
      <span className="gate-triptych-score-label">{label}</span>
    </div>
  );
}

function MiniCol({
  label,
  pass,
  text,
  accent,
}: {
  label: string;
  pass: boolean;
  text: string;
  accent?: boolean;
}) {
  return (
    <div className={`gate-triptych-col ${accent ? 'accent' : ''} ${pass ? 'pass' : 'fail'}`}>
      <span className="gate-triptych-col-label">{label}</span>
      <span className={`gate-triptych-verdict ${pass ? 'pass' : 'fail'}`}>{pass ? 'PASS' : 'FAIL'}</span>
      <p className="gate-triptych-text">{text.slice(0, 100)}{text.length > 100 ? '…' : ''}</p>
    </div>
  );
}