import { useCallback, useEffect, useRef, useState } from 'react';
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

interface NodePos {
  x: number;
  y: number;
  node: GraphNode;
}

interface MemoryGraphPanelProps {
  caseId: string;
  highlightFail?: boolean;
}

const SKIP_TYPES = new Set(['EntityType', 'DocumentChunk', 'TextDocument']);

export function MemoryGraphPanel({ caseId, highlightFail = false }: MemoryGraphPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<NodePos[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animRef = useRef(0);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [pulse, setPulse] = useState(0);

  const draw = useCallback((highlight: boolean, pulsePhase: number) => {
    const canvas = canvasRef.current;
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

    const positions = positionsRef.current;
    if (!positions.length) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText('Run remember() to build the graph', 16, h / 2);
      ctx.fillText('Interactive Cognee knowledge graph · click nodes to inspect', 16, h / 2 + 18);
      return;
    }

    const idSet = new Set(positions.map((p) => p.node.id));
    edgesRef.current.forEach((e) => {
      const s = positions.find((p) => p.node.id === e.source);
      const t = positions.find((p) => p.node.id === e.target);
      if (!s || !t || !idSet.has(e.source) || !idSet.has(e.target)) return;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    positions.forEach((p, i) => {
      const isHovered = hovered?.id === p.node.id;
      const isSelected = selected?.id === p.node.id;
      const failPulse = highlight && i % 5 === 0;
      const r = isSelected ? 9 : isHovered ? 8 : failPulse ? 6 + Math.sin(pulsePhase) * 1.5 : 5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      if (isSelected) ctx.fillStyle = 'rgba(167, 139, 250, 0.95)';
      else if (failPulse) ctx.fillStyle = `rgba(251, 191, 36, ${0.7 + Math.sin(pulsePhase) * 0.2})`;
      else if (isHovered) ctx.fillStyle = 'rgba(34, 211, 238, 1)';
      else ctx.fillStyle = 'rgba(34, 211, 238, 0.75)';
      ctx.fill();

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const label = p.node.label?.slice(0, 16);
      if (label && (isHovered || isSelected || label.length < 12)) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.font = '9px monospace';
        ctx.fillText(label, p.x - 28, p.y - 12);
      }
    });
  }, [hovered, selected]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getGraph(caseId)
      .then((graph) => {
        if (cancelled) return;
        const nodes = (graph.nodes ?? []) as GraphNode[];
        const edges = (graph.edges ?? []) as GraphEdge[];
        const entityNodes = nodes.filter((n) => !SKIP_TYPES.has(n.type ?? ''));
        const display = entityNodes.length ? entityNodes.slice(0, 48) : nodes.slice(0, 48);

        const canvas = canvasRef.current;
        const w = canvas?.getBoundingClientRect().width ?? 400;
        const h = canvas?.getBoundingClientRect().height ?? 224;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.36;

        positionsRef.current = display.map((n, i) => {
          const angle = (i / display.length) * Math.PI * 2 - Math.PI / 2;
          return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, node: n };
        });
        edgesRef.current = edges;

        setStats({ nodes: nodes.length, edges: edges.length });
        draw(highlightFail, 0);
      })
      .catch(() => {
        if (!cancelled) {
          setStats({ nodes: 0, edges: 0 });
          positionsRef.current = [];
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [caseId, draw, highlightFail]);

  useEffect(() => {
    if (!highlightFail) return;
    const tick = () => {
      setPulse((p) => p + 0.08);
      draw(highlightFail, pulse);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [highlightFail, draw, pulse]);

  useEffect(() => {
    if (!highlightFail) draw(highlightFail, 0);
  }, [hovered, selected, draw, highlightFail]);

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = positionsRef.current.find((p) => Math.hypot(p.x - mx, p.y - my) < 12);
    setHovered(hit?.node ?? null);
  };

  const onClick = () => {
    if (hovered) setSelected(hovered);
  };

  return (
    <div className="graph-panel-interactive">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-sig text-sm font-bold uppercase tracking-wide text-white">Cognee Memory Graph</h3>
        <div className="flex items-center gap-3 font-hud text-[10px] text-slate-500">
          <span className="graph-legend-item"><span className="graph-dot graph-dot-cyan" /> Entity</span>
          <span className="graph-legend-item"><span className="graph-dot graph-dot-amber" /> Failure</span>
          <span className="graph-legend-item"><span className="graph-dot graph-dot-purple" /> Selected</span>
          <span>{loading ? 'Loading…' : `${stats.nodes} nodes · ${stats.edges} edges`}</span>
        </div>
      </div>
      <div className="graph-canvas-wrap rounded-xl border border-cyan-400/15 bg-[#060a14]">
        <canvas
          className="h-56 w-full cursor-crosshair"
          onClick={onClick}
          onMouseLeave={() => setHovered(null)}
          onMouseMove={onMouseMove}
          ref={canvasRef}
        />
      </div>
      {hovered || selected ? (
        <div className="graph-tooltip">
          <span className="font-hud text-[10px] uppercase text-cyan-400">{selected?.type ?? hovered?.type ?? 'node'}</span>
          <p className="text-sm font-medium text-white">{selected?.label ?? hovered?.label ?? selected?.id ?? hovered?.id}</p>
        </div>
      ) : (
        <p className="mt-2 font-hud text-[10px] text-slate-500">
          Hover nodes · click to inspect · live from Cognee Cloud GET /graph
        </p>
      )}
    </div>
  );
}