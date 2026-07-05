import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import ForceGraph3D, { type ForceGraph3DInstance, type NodeObject } from '3d-force-graph';
import * as THREE from 'three';
import { api, type EvidenceItem } from '../api/memgateqaApi';
import {
  type GraphDisplayNode,
  type GraphLink,
  type GraphNode,
  type GraphTestInput,
  clearGraphCache,
  fetchGraphWithTimeout,
  getNeighborhood,
  mergeGraphData,
  prepareGraphDisplay,
  readGraphCache,
  synthesizeGraphFromEvidence,
  typeColor,
  writeGraphCache,
} from '../lib/graphModel';
import { searchGraphNodes, type GraphSearchHit } from '../lib/graphSearch';

const EMPTY_EVIDENCE: EvidenceItem[] = [];
const EMPTY_FAILED: string[] = [];
const EMPTY_TESTS: GraphTestInput[] = [];

const GRAPH_TYPES = [
  'Agent',
  'Evidence',
  'Test',
  'Concept',
  'DocumentChunk',
  'Source',
  'Kind',
  'Category',
  'Entity',
  'Document',
] as const;

interface ObsidianGraphViewProps {
  caseId: string;
  evidence?: EvidenceItem[];
  tests?: GraphTestInput[];
  caseName?: string;
  highlightFail?: boolean;
  failedEvidenceIds?: string[];
  height?: number;
  compact?: boolean;
  defaultMode?: '2d' | '3d';
  onNodeSelect?: (node: GraphNode | null) => void;
}

function makeLabelSprite(text: string, color: string, dimmed = false) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const fontSize = 20;
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  const display = text.length > 42 ? `${text.slice(0, 40)}…` : text;
  const w = Math.min(320, ctx.measureText(display).width + 16);
  canvas.width = w;
  canvas.height = fontSize + 10;
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = dimmed ? 'rgba(6, 10, 20, 0.45)' : 'rgba(6, 10, 20, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = dimmed ? 'rgba(148, 163, 184, 0.7)' : color;
  ctx.fillText(display, 8, fontSize);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(w * 0.2, (fontSize + 10) * 0.2, 1);
  sprite.position.y = 10;
  return sprite;
}

export function ObsidianGraphView({
  caseId,
  evidence: evidenceProp,
  tests: testsProp,
  caseName: caseNameProp,
  highlightFail = false,
  failedEvidenceIds: failedProp,
  height = 480,
  compact,
  defaultMode = '2d',
  onNodeSelect,
}: ObsidianGraphViewProps) {
  const evidence = evidenceProp ?? EMPTY_EVIDENCE;
  const failedEvidenceIds = failedProp ?? EMPTY_FAILED;
  const tests = testsProp ?? EMPTY_TESTS;

  const hostRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance | null>(null);
  const onSelectRef = useRef(onNodeSelect);
  const ctxRef = useRef({
    showLabels: false,
    mode: defaultMode,
    highlightId: null as string | null,
    neighborIds: null as Set<string> | null,
    matchIds: null as Set<string> | null,
    searchFocusId: null as string | null,
  });
  const linksRef = useRef<GraphLink[]>([]);
  const displayNodesRef = useRef<GraphDisplayNode[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'2d' | '3d'>(defaultMode);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [showLabels, setShowLabels] = useState(false);
  const labelsTouchedRef = useRef(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [stats, setStats] = useState({
    shown: 0,
    total: 0,
    edges: 0,
    synthesized: false,
    enriched: false,
    typeCounts: {} as Record<string, number>,
  });
  const [focused, setFocused] = useState<GraphDisplayNode | null>(null);
  const [autoSpin, setAutoSpin] = useState(defaultMode === '3d');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [hideOrphans, setHideOrphans] = useState(false);
  const [highlightDepth, setHighlightDepth] = useState(1);
  const [searchHits, setSearchHits] = useState<GraphSearchHit[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [isolateSearch, setIsolateSearch] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [caseMeta, setCaseMeta] = useState<{ evidence: EvidenceItem[]; tests: GraphTestInput[]; name: string }>({
    evidence: [],
    tests: [],
    name: '',
  });

  const mergedEvidence = evidence.length ? evidence : caseMeta.evidence;
  const mergedTests = tests.length ? tests : caseMeta.tests;
  const mergedCaseName = caseNameProp ?? caseMeta.name;

  onSelectRef.current = onNodeSelect;

  useEffect(() => {
    if (evidenceProp?.length && testsProp?.length) return;
    api
      .getCase(caseId)
      .then((c) => {
        setCaseMeta({
          evidence: c.evidence ?? [],
          tests: (c.tests ?? []).map((t) => ({
            id: t.id,
            title: t.title,
            category: t.category,
            evidenceIds: t.evidenceIds,
          })),
          name: c.agent ?? c.name ?? '',
        });
      })
      .catch(() => {});
  }, [caseId, evidenceProp?.length, testsProp?.length]);

  const paintNode = useCallback((node: GraphDisplayNode) => {
    const ctx = ctxRef.current;
    const highlighted = ctx.highlightId;
    const neighbors = ctx.neighborIds;
    const matchIds = ctx.matchIds;
    const searchFocusId = ctx.searchFocusId;
    const inSearch = Boolean(matchIds?.size);
    const dimmed = Boolean(
      (highlighted && neighbors && !neighbors.has(node.id)) ||
        (inSearch && matchIds && !matchIds.has(node.id)),
    );
    const isSearchPick = searchFocusId === node.id;
    const isSearchMatch = matchIds?.has(node.id);

    const group = new THREE.Group();
    const r = Math.cbrt(node.val) * (ctx.mode === '2d' ? 0.95 : 1.1);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 10),
      new THREE.MeshLambertMaterial({
        color: node.color,
        transparent: true,
        opacity: dimmed ? 0.22 : 0.92,
      }),
    );
    group.add(sphere);

    if (node.trapHit) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r + 1.2, r + 2.8, 24),
        new THREE.MeshBasicMaterial({
          color: '#fbbf24',
          transparent: true,
          opacity: dimmed ? 0.25 : 0.75,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    if (isSearchMatch && inSearch) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r + 2.5, r + (isSearchPick ? 5 : 3.8), 28),
        new THREE.MeshBasicMaterial({
          color: isSearchPick ? '#22d3ee' : '#a78bfa',
          transparent: true,
          opacity: isSearchPick ? 0.95 : dimmed ? 0.2 : 0.55,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    }

    const label = node.label ?? node.id;
    const showThisLabel =
      ctx.showLabels &&
      (!highlighted || neighbors?.has(node.id) || node.id === highlighted || node.degree >= 2);
    if (showThisLabel) {
      group.add(makeLabelSprite(label, node.color, dimmed));
    }

    return group;
  }, []);

  const applyHighlight = useCallback((nodeId: string | null) => {
    ctxRef.current.highlightId = nodeId;
    ctxRef.current.neighborIds = nodeId
      ? getNeighborhood(nodeId, linksRef.current, highlightDepth)
      : null;
    graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
    graphRef.current?.linkColor((l) => {
      if (!nodeId || !ctxRef.current.neighborIds) return 'rgba(148, 163, 184, 0.35)';
      const src = typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source);
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target);
      const hit = ctxRef.current.neighborIds!.has(src) && ctxRef.current.neighborIds!.has(tgt);
      return hit ? 'rgba(34, 211, 238, 0.75)' : 'rgba(51, 65, 85, 0.12)';
    });
    graphRef.current?.linkWidth((l) => {
      if (!nodeId || !ctxRef.current.neighborIds) return 0.8;
      const src = typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source);
      const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target);
      return ctxRef.current.neighborIds!.has(src) && ctxRef.current.neighborIds!.has(tgt) ? 2.2 : 0.3;
    });
  }, [highlightDepth, paintNode]);

  const rawGraphRef = useRef<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });

  const applySearchVisuals = useCallback(
    (hits: GraphSearchHit[], index: number) => {
      const ids = new Set(hits.map((h) => h.node.id));
      ctxRef.current.matchIds = ids.size ? ids : null;
      ctxRef.current.searchFocusId = hits[index]?.node.id ?? null;
      graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
      graphRef.current?.linkColor((l) => {
        if (!ids.size) return 'rgba(148, 163, 184, 0.35)';
        const src = typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source);
        const tgt = typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target);
        const hit = ids.has(src) && ids.has(tgt);
        return hit ? 'rgba(167, 139, 250, 0.65)' : 'rgba(51, 65, 85, 0.1)';
      });
    },
    [paintNode],
  );

  const focusNode = useCallback(
    (node: GraphDisplayNode, pushHighlight = true) => {
      setFocused(node);
      onSelectRef.current?.(node);
      if (pushHighlight) applyHighlight(node.id);
      const nx = (node as { x?: number }).x ?? 0;
      const ny = (node as { y?: number }).y ?? 0;
      const nz = (node as { z?: number }).z ?? 0;
      const is3d = modeRef.current === '3d';
      const dist = is3d ? 120 : 80;
      graphRef.current?.cameraPosition(
        { x: nx + dist * 0.45, y: ny + dist * 0.3, z: nz + (is3d ? dist : 1) },
        { x: nx, y: ny, z: nz },
        700,
      );
    },
    [applyHighlight],
  );

  const reapplyFilters = useCallback(() => {
    const { nodes: rawNodes, links: rawLinks } = rawGraphRef.current;
    const prepared = prepareGraphDisplay(
      rawNodes,
      rawLinks,
      mergedEvidence,
      failedEvidenceIds,
      highlightFail,
      { typeFilter: typeFilter.size ? typeFilter : undefined, hideOrphans },
    );
    let { nodes, links } = prepared;
    const { totalRaw, typeCounts } = prepared;

    if (isolateSearch && searchHits.length > 0) {
      const keep = new Set<string>();
      for (const h of searchHits) {
        keep.add(h.node.id);
        for (const id of getNeighborhood(h.node.id, links, 1)) keep.add(id);
      }
      nodes = nodes.filter((n) => keep.has(n.id));
      const idSet = new Set(nodes.map((n) => n.id));
      links = links.filter((l) => idSet.has(l.source) && idSet.has(l.target));
    }

    displayNodesRef.current = nodes;
    linksRef.current = links;
    graphRef.current?.graphData({
      nodes,
      links: links.map((l) => ({ source: l.source, target: l.target, label: l.label })),
    });
    graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
    if (focused && !nodes.some((n) => n.id === focused.id)) {
      setFocused(null);
      applyHighlight(null);
    } else if (focused) {
      applyHighlight(focused.id);
    }
    setStats((s) => ({
      ...s,
      shown: nodes.length,
      total: totalRaw,
      edges: links.length,
      typeCounts,
    }));
  }, [
    applyHighlight,
    failedEvidenceIds,
    focused,
    hideOrphans,
    highlightFail,
    isolateSearch,
    mergedEvidence,
    paintNode,
    searchHits,
    typeFilter,
  ]);

  const applyData = useCallback(
    (rawNodes: GraphNode[], rawLinks: GraphLink[], meta: { synthesized: boolean; enriched: boolean }) => {
      rawGraphRef.current = { nodes: rawNodes, links: rawLinks };
      const { nodes, links, totalRaw, typeCounts } = prepareGraphDisplay(
        rawNodes,
        rawLinks,
        mergedEvidence,
        failedEvidenceIds,
        highlightFail,
        { typeFilter: typeFilter.size ? typeFilter : undefined, hideOrphans },
      );
      displayNodesRef.current = nodes;
      linksRef.current = links;
      graphRef.current?.graphData({
        nodes,
        links: links.map((l) => ({ source: l.source, target: l.target, label: l.label })),
      });
      graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
      if (search.trim()) {
        const hits = searchGraphNodes(nodes, search);
        setSearchHits(hits);
        applySearchVisuals(hits, searchIndex);
      }
      if (!labelsTouchedRef.current) {
        setShowLabels(nodes.length <= 32);
      }
      setStats({
        shown: nodes.length,
        total: totalRaw,
        edges: links.length,
        synthesized: meta.synthesized,
        enriched: meta.enriched,
        typeCounts,
      });
      graphRef.current?.linkDirectionalParticles(nodes.length > 40 ? 0 : 1);
      window.requestAnimationFrame(() => graphRef.current?.zoomToFit(400, 36));
    },
    [applySearchVisuals, failedEvidenceIds, hideOrphans, highlightFail, mergedEvidence, paintNode, search, searchIndex, typeFilter],
  );

  const loadGraph = useCallback(async (force = false) => {
    if (force) clearGraphCache(caseId);
    const cached = !force ? readGraphCache(caseId) : null;
    if (cached) {
      applyData(cached.nodes, cached.links, { synthesized: false, enriched: true });
      setLoading(false);
    } else {
      setLoading(true);
    }
    setLoadError('');
    let synthesized = false;
    let enriched = false;
    try {
      let rawNodes: GraphNode[] = [];
      let rawLinks: GraphLink[] = [];

      try {
        const graph = await fetchGraphWithTimeout(api.getGraph.bind(api), caseId);
        rawNodes = (graph.nodes ?? []) as GraphNode[];
        rawLinks = (graph.edges ?? []) as GraphLink[];
      } catch {
        /* fall through */
      }

      const syn = synthesizeGraphFromEvidence(mergedEvidence, mergedCaseName, mergedTests);
      if (rawNodes.length === 0 && syn.nodes.length > 0) {
        rawNodes = syn.nodes;
        rawLinks = syn.links;
        synthesized = true;
      } else if (syn.nodes.length > 0) {
        const merged = mergeGraphData({ nodes: rawNodes, links: rawLinks }, syn);
        rawNodes = merged.nodes;
        rawLinks = merged.links;
        enriched = true;
      }

      writeGraphCache(caseId, rawNodes, rawLinks);
      applyData(rawNodes, rawLinks, { synthesized, enriched });

      if (rawNodes.length === 0) {
        setLoadError('No nodes yet — add evidence or press GO on the belt');
      }
    } catch {
      setStats({
        shown: 0,
        total: 0,
        edges: 0,
        synthesized: false,
        enriched: false,
        typeCounts: {},
      });
      rawGraphRef.current = { nodes: [], links: [] };
      graphRef.current?.graphData({ nodes: [], links: [] });
      setLoadError('Could not load graph — run .\\start.ps1 then Refresh');
    } finally {
      setLoading(false);
    }
  }, [applyData, caseId, mergedCaseName, mergedEvidence, mergedTests]);

  useEffect(() => {
    if (!loading && rawGraphRef.current.nodes.length) reapplyFilters();
  }, [typeFilter, hideOrphans, isolateSearch, reapplyFilters, loading]);

  useEffect(() => {
    if (loading) return;
    const t = window.setTimeout(() => {
      const nodes = displayNodesRef.current;
      if (!search.trim()) {
        setSearchHits([]);
        ctxRef.current.matchIds = null;
        ctxRef.current.searchFocusId = null;
        graphRef.current?.linkColor(() => 'rgba(148, 163, 184, 0.35)');
        graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
        return;
      }
      const hits = searchGraphNodes(nodes, search);
      setSearchHits(hits);
      applySearchVisuals(hits, Math.min(searchIndex, Math.max(0, hits.length - 1)));
    }, 180);
    return () => window.clearTimeout(t);
  }, [applySearchVisuals, loading, paintNode, search, searchIndex]);

  useEffect(() => {
    setSearchIndex(0);
  }, [search]);

  ctxRef.current.showLabels = showLabels;
  ctxRef.current.mode = mode;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const graph = new ForceGraph3D(host)
      .backgroundColor('rgba(6, 10, 20, 0)')
      .showNavInfo(false)
      .numDimensions(defaultMode === '3d' ? 3 : 2)
      .nodeLabel((n: NodeObject) => {
        const node = n as GraphDisplayNode;
        return `${node.label ?? node.id}\n${node.type ?? 'node'} · ${node.degree} links`;
      })
      .linkLabel((l) => String((l as { label?: string }).label ?? ''))
      .linkColor(() => 'rgba(148, 163, 184, 0.35)')
      .linkWidth(0.8)
      .linkOpacity(0.55)
      .linkDirectionalParticles(1)
      .linkDirectionalParticleWidth(1)
      .linkDirectionalParticleSpeed(0.004)
      .warmupTicks(48)
      .cooldownTicks(90)
      .onNodeClick((n: NodeObject) => {
        const node = n as GraphDisplayNode;
        setFocused(node);
        onSelectRef.current?.(node);
        applyHighlight(node.id);
        const nx = (n as { x?: number }).x ?? 0;
        const ny = (n as { y?: number }).y ?? 0;
        const nz = (n as { z?: number }).z ?? 0;
        const is3d = modeRef.current === '3d';
        const dist = is3d ? 140 : 90;
        graph.cameraPosition(
          { x: nx + dist * 0.5, y: ny + dist * 0.35, z: nz + (is3d ? dist : 1) },
          { x: nx, y: ny, z: nz },
          1000,
        );
      })
      .onBackgroundClick(() => {
        setFocused(null);
        onSelectRef.current?.(null);
        applyHighlight(null);
      });

    graph.d3Force('charge')?.strength(-110);
    graph.d3Force('link')?.distance(36);

    graph.scene().add(new THREE.AmbientLight(0xb0c4de, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(60, 100, 80);
    graph.scene().add(dir);

    graphRef.current = graph;

    return () => {
      host.innerHTML = '';
      graphRef.current = null;
    };
  }, [applyHighlight, defaultMode]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    graphRef.current?.numDimensions(mode === '3d' ? 3 : 2);
    ctxRef.current.mode = mode;
    if (mode === '2d') setAutoSpin(false);
    graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
  }, [mode, paintNode]);

  useEffect(() => {
    graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
  }, [showLabels, paintNode]);

  useEffect(() => {
    if (focused) applyHighlight(focused.id);
  }, [highlightDepth, focused, applyHighlight]);

  useEffect(() => {
    const prevOpRef = { current: null as string | null };
    const poll = () => {
      if (document.hidden) return;
      api
        .getOps(caseId)
        .then((ops) => {
          const latest = ops[0];
          if (!latest || latest.op === prevOpRef.current) return;
          prevOpRef.current = latest.op;
          if (latest.op.startsWith('remember') || latest.op.startsWith('improve')) {
            void loadGraph(true);
          }
        })
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, 8000);
    const onVis = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [caseId, loadGraph]);

  useEffect(() => {
    if (!autoSpin || loading || mode !== '3d' || !graphRef.current) return;
    let angle = 0;
    let raf = 0;
    const spin = () => {
      angle += 0.002;
      const dist = 320;
      graphRef.current?.cameraPosition({
        x: dist * Math.sin(angle),
        y: 50,
        z: dist * Math.cos(angle),
      });
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, loading, mode]);

  const focusSearchHit = (index = searchIndex) => {
    const hit = searchHits[index];
    if (!hit) return;
    setSearchIndex(index);
    ctxRef.current.searchFocusId = hit.node.id;
    applySearchVisuals(searchHits, index);
    focusNode(hit.node);
  };

  const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!searchHits.length) return;
      const next = (searchIndex + 1) % searchHits.length;
      setSearchIndex(next);
      ctxRef.current.searchFocusId = searchHits[next].node.id;
      applySearchVisuals(searchHits, next);
      setSearchOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!searchHits.length) return;
      const next = (searchIndex - 1 + searchHits.length) % searchHits.length;
      setSearchIndex(next);
      ctxRef.current.searchFocusId = searchHits[next].node.id;
      applySearchVisuals(searchHits, next);
      setSearchOpen(true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      focusSearchHit(searchIndex);
      setSearchOpen(false);
    } else if (e.key === 'Escape') {
      setSearch('');
      setSearchHits([]);
      setSearchOpen(false);
      ctxRef.current.matchIds = null;
      ctxRef.current.searchFocusId = null;
      applyHighlight(null);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setSearchHits([]);
    setSearchIndex(0);
    setSearchOpen(false);
    ctxRef.current.matchIds = null;
    ctxRef.current.searchFocusId = null;
    graphRef.current?.linkColor(() => 'rgba(148, 163, 184, 0.35)');
    graphRef.current?.nodeThreeObject((n: NodeObject) => paintNode(n as GraphDisplayNode));
  };

  const fitView = () => graphRef.current?.zoomToFit(600, 48);

  const toggleType = (type: string) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const legendTypes = useMemo(() => {
    const counts = stats.typeCounts;
    return GRAPH_TYPES.filter((t) => (counts[t] ?? 0) > 0);
  }, [stats.typeCounts]);

  return (
    <div className={`obsidian-graph ${compact ? 'compact' : ''}`}>
      <div className="obsidian-graph-toolbar">
        <div className="obsidian-graph-toolbar-left">
          <p className="font-hud text-[9px] uppercase tracking-wider text-violet-300">Memory graph</p>
          <h3 className="font-sig text-sm font-bold text-white">Obsidian view · every node</h3>
        </div>
        <div className="obsidian-graph-toolbar-right">
          <div className="obsidian-graph-search-wrap">
            <input
              ref={searchInputRef}
              aria-autocomplete="list"
              aria-expanded={searchOpen && searchHits.length > 0}
              className="obsidian-graph-search"
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
                setSearchIndex(0);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKey}
              placeholder="Search nodes — type:evidence intent:endpoint…"
              value={search}
            />
            {search ? (
              <button className="obsidian-graph-search-clear" onClick={clearSearch} type="button" aria-label="Clear search">
                ×
              </button>
            ) : null}
            {searchOpen && search.trim() ? (
              <div className="obsidian-graph-search-results" role="listbox">
                {searchHits.length === 0 ? (
                  <p className="obsidian-graph-search-empty">No nodes match</p>
                ) : (
                  searchHits.slice(0, 14).map((hit, i) => (
                    <button
                      key={hit.node.id}
                      className={`obsidian-graph-search-hit ${i === searchIndex ? 'active' : ''}`}
                      onMouseEnter={() => setSearchIndex(i)}
                      onClick={() => focusSearchHit(i)}
                      role="option"
                      type="button"
                    >
                      <span className="obsidian-graph-search-hit-type">{hit.node.type ?? 'node'}</span>
                      <span className="obsidian-graph-search-hit-label">{hit.snippet}</span>
                      <span className="obsidian-graph-search-hit-meta">{hit.matchedFields.join(' · ')}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => focusSearchHit()} type="button">
            Go {searchHits.length ? `(${searchHits.length})` : ''}
          </button>
          <button
            className={`ent-btn ent-btn-ghost ent-btn-sm ${isolateSearch ? 'active' : ''}`}
            disabled={!searchHits.length}
            onClick={() => setIsolateSearch((v) => !v)}
            title="Show only search matches and neighbors"
            type="button"
          >
            Isolate
          </button>
          <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={fitView} type="button">
            Fit
          </button>
          <button
            className={`ent-btn ent-btn-ghost ent-btn-sm ${showLabels ? 'active' : ''}`}
            onClick={() => {
              labelsTouchedRef.current = true;
              setShowLabels((v) => !v);
            }}
            type="button"
          >
            Labels
          </button>
          <button
            className={`ent-btn ent-btn-ghost ent-btn-sm ${hideOrphans ? 'active' : ''}`}
            onClick={() => setHideOrphans((v) => !v)}
            type="button"
          >
            Links only
          </button>
          <button
            className={`ent-btn ent-btn-ghost ent-btn-sm ${mode === '2d' ? 'active' : ''}`}
            onClick={() => setMode('2d')}
            type="button"
          >
            2D
          </button>
          <button
            className={`ent-btn ent-btn-ghost ent-btn-sm ${mode === '3d' ? 'active' : ''}`}
            onClick={() => setMode('3d')}
            type="button"
          >
            3D
          </button>
          {mode === '3d' ? (
            <button
              className={`ent-btn ent-btn-ghost ent-btn-sm ${autoSpin ? 'active' : ''}`}
              onClick={() => setAutoSpin((v) => !v)}
              type="button"
            >
              Orbit
            </button>
          ) : null}
          <button className="ent-btn ent-btn-secondary ent-btn-sm" onClick={() => void loadGraph(true)} type="button">
            Refresh
          </button>
        </div>
      </div>

      {legendTypes.length > 0 ? (
        <div className="obsidian-graph-filters">
          {legendTypes.map((t) => (
            <button
              key={t}
              className={`obsidian-graph-type-chip ${typeFilter.has(t) ? 'active' : ''}`}
              onClick={() => toggleType(t)}
              style={{ '--chip-color': typeColor(t) } as CSSProperties}
              title={`Filter ${t}`}
              type="button"
            >
              <i />
              {t} <span>{stats.typeCounts[t] ?? 0}</span>
            </button>
          ))}
          {typeFilter.size > 0 ? (
            <button className="obsidian-graph-type-clear" onClick={() => setTypeFilter(new Set())} type="button">
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="obsidian-graph-stage" style={{ height }}>
        <div className="obsidian-graph-grid" aria-hidden />
        <div className="obsidian-graph-canvas" ref={hostRef} />
        {loading ? <div className="obsidian-graph-overlay">Loading graph…</div> : null}
        {!loading && stats.shown === 0 ? (
          <div className="obsidian-graph-overlay">{loadError}</div>
        ) : null}
      </div>

      <div className="obsidian-graph-foot">
        <div className="obsidian-graph-legend">
          <span><i style={{ background: '#a78bfa' }} /> Evidence</span>
          <span><i style={{ background: '#fbbf24' }} /> Tests</span>
          <span><i style={{ background: '#22d3ee' }} /> Agent</span>
          <span><i style={{ background: '#60a5fa' }} /> Concepts</span>
          <span><i style={{ background: '#64748b' }} /> Chunks</span>
          <span><i style={{ background: '#f87171' }} /> Trap</span>
        </div>
        <span className="obsidian-graph-stats">
          {stats.shown} nodes
          {stats.total > stats.shown ? ` / ${stats.total} in pool` : ''}
          {' · '}{stats.edges} links
          {stats.synthesized ? ' · built from evidence' : stats.enriched ? ' · Cognee + evidence merged' : ''}
        </span>
      </div>

      {focused ? (
        <div className="obsidian-graph-focus">
          <div className="obsidian-graph-focus-head">
            <span className="font-hud text-[9px] uppercase text-cyan-400">{focused.type ?? 'node'}</span>
            <label className="obsidian-graph-depth">
              Depth
              <select
                onChange={(e) => setHighlightDepth(Number(e.target.value))}
                value={highlightDepth}
              >
                <option value={1}>1 hop</option>
                <option value={2}>2 hops</option>
                <option value={3}>3 hops</option>
              </select>
            </label>
          </div>
          <p className="text-sm font-medium text-white">{focused.label ?? focused.id}</p>
          <p className="text-xs text-slate-500">
            {focused.degree} connections · {focused.sensitivity}
            {ctxRef.current.neighborIds ? ` · ${ctxRef.current.neighborIds.size} in focus` : ''}
          </p>
        </div>
      ) : (
        <p className="obsidian-graph-hint">
          Search: type:evidence postgres · intent:endpoint · ↑↓ pick · Enter focus · Esc clear
        </p>
      )}
    </div>
  );
}