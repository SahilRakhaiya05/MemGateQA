import { useEffect, useState } from 'react';
import { api } from '../api/memgateqaApi';

interface MemoryGraphMiniProps {
  caseId: string;
}

/** Hermes/Hindsight graph wow — compact QA dashboard version. */
export function MemoryGraphMini({ caseId }: MemoryGraphMiniProps) {
  const [nodes, setNodes] = useState(0);
  const [edges, setEdges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getGraph(caseId)
      .then((g) => {
        setNodes((g.nodes as unknown[])?.length ?? 0);
        setEdges((g.edges as unknown[])?.length ?? 0);
      })
      .catch(() => {
        setNodes(0);
        setEdges(0);
      })
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) return <div className="memory-graph-mini skeleton" />;

  return (
    <div className="memory-graph-mini">
      <div className="memory-graph-mini-bars" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className="memory-graph-mini-bar"
            style={{ height: `${20 + ((nodes + i * 3) % 5) * 12}%`, opacity: nodes ? 0.4 + (i % 3) * 0.2 : 0.15 }}
          />
        ))}
      </div>
      <div className="memory-graph-mini-stats">
        <span><strong>{nodes}</strong> nodes</span>
        <span><strong>{edges}</strong> edges</span>
      </div>
    </div>
  );
}