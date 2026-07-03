import { useEffect, useRef, useState } from 'react';
import { api } from '../api/memgateqaApi';

interface GraphNode {
  id: string;
  label?: string;
  type?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface MemoryGraphPanelProps {
  caseId: string;
  highlightFail?: boolean;
}

export function MemoryGraphPanel({ caseId, highlightFail = false }: MemoryGraphPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getGraph(caseId)
      .then((graph) => {
        if (cancelled) return;
        const nodes = (graph.nodes ?? []) as GraphNode[];
        const edges = (graph.edges ?? []) as GraphEdge[];
        setStats({ nodes: nodes.length, edges: edges.length });
        drawGraph(canvasRef.current, nodes, edges, highlightFail);
      })
      .catch(() => {
        if (!cancelled) setStats({ nodes: 0, edges: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, highlightFail]);

  return (
    <div className="rounded-2xl border border-white/10 bg-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-sig text-sm font-bold uppercase tracking-wide text-white">Cognee Memory Graph</h3>
        <span className="font-hud text-[10px] text-slate-500">
          {loading ? 'Loading…' : `${stats.nodes} nodes · ${stats.edges} edges`}
        </span>
      </div>
      <div className="graph-canvas-wrap rounded-xl border border-cyan-400/15 bg-[#060a14]">
        <canvas className="h-56 w-full" ref={canvasRef} />
      </div>
      <p className="mt-2 font-hud text-[10px] text-slate-500">
        Live graph from Cognee Cloud · {highlightFail ? 'Failed tests pulse amber' : 'Pulled after remember/memify'}
      </p>
    </div>
  );
}

function drawGraph(
  canvas: HTMLCanvasElement | null,
  nodes: GraphNode[],
  edges: GraphEdge[],
  pulse: boolean,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const entityNodes = nodes.filter((n) => !['EntityType', 'DocumentChunk', 'TextDocument'].includes(n.type ?? ''));
  const display = entityNodes.length ? entityNodes.slice(0, 40) : nodes.slice(0, 40);
  if (!display.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Run remember() to build the graph', 16, h / 2);
    return;
  }

  const positions = new Map<string, { x: number; y: number }>();
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.35;
  display.forEach((n, i) => {
    const angle = (i / display.length) * Math.PI * 2 - Math.PI / 2;
    positions.set(n.id, { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
  });

  const idSet = new Set(display.map((n) => n.id));
  edges.forEach((e) => {
    const s = positions.get(e.source);
    const t = positions.get(e.target);
    if (!s || !t || !idSet.has(e.source) || !idSet.has(e.target)) return;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  display.forEach((n, i) => {
    const p = positions.get(n.id)!;
    const r = pulse && i % 5 === 0 ? 7 : 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = pulse && i % 5 === 0 ? 'rgba(251, 191, 36, 0.9)' : 'rgba(34, 211, 238, 0.85)';
    ctx.fill();
    if (n.label && n.label.length < 20) {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
      ctx.font = '9px monospace';
      ctx.fillText(n.label.slice(0, 14), p.x - 20, p.y - 10);
    }
  });
}