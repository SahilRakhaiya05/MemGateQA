import { Link } from 'react-router-dom';
import { MemoryLifecyclePills } from './MemoryLifecyclePills';

const COGNEE_OPS = [
  {
    fn: 'remember()',
    cognee: 'Ingest evidence into knowledge graph + vectors',
    memgate: 'Index case packets — public vs private datasets separated',
  },
  {
    fn: 'recall()',
    cognee: 'Semantic + graph query over agent memory',
    memgate: 'Trap questions — catch stale, leaky, or wrong answers',
  },
  {
    fn: 'improve()',
    cognee: 'Apply human feedback, prune stale graph nodes',
    memgate: 'Approved repair only — promote final architecture truth',
  },
  {
    fn: 'forget()',
    cognee: 'Delete private data from the graph',
    memgate: 'Prove deletion — negative recall traps must pass',
  },
] as const;

interface CogneeProductFlowProps {
  compact?: boolean;
}

export function CogneeProductFlow({ compact }: CogneeProductFlowProps) {
  return (
    <section className={`cognee-product-flow ${compact ? 'compact' : ''}`}>
      <div className="cognee-product-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Built for Cognee</p>
          <h2 className="font-sig text-xl font-bold text-white">
            The memory QA gate for Cognee-powered agents
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Cognee gives agents persistent long-term memory across sessions. MemGateQA proves that memory
            is fresh, grounded, private, and safe before you trust it in production — using every Cognee
            lifecycle API with a scored certificate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ent-btn ent-btn-primary" to="/cases/case-wolfpack">
            Run WolfPack gate
          </Link>
          <a
            className="ent-btn ent-btn-ghost"
            href="https://github.com/topoteretes/cognee"
            rel="noopener noreferrer"
            target="_blank"
          >
            Cognee on GitHub
          </a>
        </div>
      </div>

      <MemoryLifecyclePills active={['remember', 'recall', 'improve', 'forget']} fnStyle />

      <div className="cognee-product-grid">
        {COGNEE_OPS.map((op) => (
          <div key={op.fn} className="cognee-product-card">
            <p className="cognee-product-fn">{op.fn}</p>
            <p className="cognee-product-cognee">
              <span className="cognee-product-tag">Cognee</span>
              {op.cognee}
            </p>
            <p className="cognee-product-memgate">
              <span className="cognee-product-tag memgate">MemGateQA</span>
              {op.memgate}
            </p>
          </div>
        ))}
      </div>

      {!compact ? (
        <div className="cognee-product-pipeline">
          <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">End-to-end flow</p>
          <p className="cognee-product-steps">
            Evidence → <strong>remember()</strong> → trap <strong>recall()</strong> → failures → approve{' '}
            <strong>improve()</strong> + <strong>forget()</strong> → rerun → Memory Health Certificate
          </p>
        </div>
      ) : null}
    </section>
  );
}