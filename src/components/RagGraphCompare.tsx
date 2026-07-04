import { motion } from 'framer-motion';

interface CompareGrade {
  status: string;
  reason?: string;
}

interface CompareSide {
  answer: string;
  grade: CompareGrade;
  latencyMs?: number;
}

interface RagGraphCompareProps {
  expected?: string;
  rag: CompareSide;
  graph: CompareSide;
  testTitle?: string;
}

export function RagGraphCompare({ expected, rag, graph, testTitle }: RagGraphCompareProps) {
  const graphWins = graph.grade.status === 'pass' && rag.grade.status !== 'pass';
  const ragWins = rag.grade.status === 'pass' && graph.grade.status !== 'pass';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rag-compare"
      initial={{ opacity: 0, y: 8 }}
    >
      {testTitle ? (
        <p className="mb-3 font-hud text-[10px] uppercase tracking-wider text-slate-500">
          Compare mode · {testTitle}
        </p>
      ) : null}

      <div className="rag-compare-grid">
        <CompareColumn
          accent="orange"
          grade={rag.grade}
          latencyMs={rag.latencyMs}
          subtitle="Cosine similarity chunks"
          text={rag.answer}
          title="Plain RAG"
          winner={ragWins}
        />
        <CompareColumn
          accent="cyan"
          grade={graph.grade}
          latencyMs={graph.latencyMs}
          subtitle="Cognee graph traversal"
          text={graph.answer}
          title="GraphRAG (Cognee)"
          winner={graphWins}
        />
        {expected ? (
          <CompareColumn
            accent="emerald"
            grade={{ status: 'pass' }}
            subtitle="Audit ground truth"
            text={expected}
            title="Expected"
            winner={false}
          />
        ) : null}
      </div>

      {graphWins ? (
        <p className="mt-3 text-center font-hud text-[11px] text-cyan-300">
          Graph traversal caught what plain RAG missed — entity relationships matter for memory QA.
        </p>
      ) : null}
    </motion.div>
  );
}

function CompareColumn({
  title,
  subtitle,
  text,
  grade,
  accent,
  winner,
  latencyMs,
}: {
  title: string;
  subtitle: string;
  text: string;
  grade: CompareGrade;
  accent: 'orange' | 'cyan' | 'emerald';
  winner: boolean;
  latencyMs?: number;
}) {
  const pass = grade.status === 'pass';
  return (
    <div className={`rag-compare-col rag-compare-${accent} ${winner ? 'rag-compare-winner' : ''}`}>
      <div className="rag-compare-col-head">
        <div>
          <h4 className="font-sig text-sm font-bold text-white">{title}</h4>
          <p className="font-hud text-[9px] uppercase text-slate-500">{subtitle}</p>
        </div>
        <span className={`rag-compare-badge ${pass ? 'pass' : 'fail'}`}>{grade.status}</span>
      </div>
      <p className="rag-compare-body">{text.slice(0, 500)}{text.length > 500 ? '…' : ''}</p>
      {latencyMs != null ? (
        <p className="mt-2 font-hud text-[9px] text-slate-500">{latencyMs}ms</p>
      ) : null}
      {winner ? <div className="rag-compare-crown">👑</div> : null}
    </div>
  );
}