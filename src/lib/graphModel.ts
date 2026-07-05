import type { EvidenceItem } from '../api/memgateqaApi';

export interface GraphNode {
  id: string;
  label?: string;
  type?: string;
  properties?: Record<string, unknown>;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

export interface GraphDisplayNode extends GraphNode {
  val: number;
  color: string;
  sensitivity: string;
  trapHit: boolean;
  degree: number;
}

export interface GraphTestInput {
  id: string;
  title?: string;
  category?: string;
  evidenceIds?: string[];
}

/** 0 = unlimited — Obsidian shows the full graph */
export const MAX_GRAPH_NODES = 0;

/** Only skip schema meta-types — keep chunks & documents visible like Obsidian */
const SKIP_TYPES = new Set(['EntityType']);

const TYPE_COLORS: Record<string, string> = {
  Evidence: '#a78bfa',
  Test: '#fbbf24',
  Agent: '#22d3ee',
  Entity: '#4ade80',
  Concept: '#60a5fa',
  Person: '#f472b6',
  Organization: '#fb923c',
  DocumentChunk: '#64748b',
  TextDocument: '#475569',
  Document: '#94a3b8',
  Source: '#cbd5e1',
  Category: '#e879f9',
  Kind: '#2dd4bf',
  default: '#38bdf8',
};

const SENS_COLORS: Record<string, string> = {
  private: '#fb7185',
  secret: '#c084fc',
  internal: '#22d3ee',
  public: '#4ade80',
  trap: '#f87171',
};

const TECH_TERMS =
  /\b(?:Next\.js|Postgres|pgvector|Cognee(?:\s+Cloud)?|Supabase|Twilio|Vercel|Redis|Google Drive|RLS)\b/gi;

function slugId(prefix: string, text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `${prefix}-${slug || 'node'}`;
}

function extractTerms(body: string): string[] {
  const terms = new Set<string>();
  for (const m of body.matchAll(TECH_TERMS)) terms.add(m[0]);
  for (const m of body.matchAll(/"([^"]{2,48})"/g)) terms.add(m[1].trim());
  for (const m of body.matchAll(/\b(?:INC-\d+|ev-[a-z0-9-]+)\b/gi)) terms.add(m[0]);
  return [...terms].slice(0, 14);
}

function chunkSentences(body: string, evidenceId: string, maxChunks = 8): GraphNode[] {
  const sentences = body
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  return sentences.slice(0, maxChunks).map((s, i) => ({
    id: `${evidenceId}__chunk_${i}`,
    label: s.slice(0, 72),
    type: 'DocumentChunk',
    properties: { parent: evidenceId },
  }));
}

function linkId(source: string, target: string, label?: string): string {
  return `${source}|${target}|${label ?? ''}`;
}

function parseDnaFields(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/DNA_(\w+):\s*([^\n]+)/gi)) {
    out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

export function nodeLabel(node: GraphNode): string {
  const raw = node.label ?? node.properties?.name ?? node.properties?.title ?? node.id;
  return String(raw).replace(/\s+/g, ' ').trim().slice(0, 64);
}

export function sensitivityForNode(node: GraphNode, evidence: EvidenceItem[]): string {
  const props = node.properties?.sensitivity;
  if (typeof props === 'string') return props;

  const parent = node.properties?.parent;
  if (typeof parent === 'string') {
    const parentEv = evidence.find((e) => e.id === parent);
    if (parentEv) return parentEv.sensitivity;
  }

  const label = nodeLabel(node).toLowerCase();
  for (const ev of evidence) {
    const hit =
      node.id === ev.id ||
      label.includes(ev.id.toLowerCase()) ||
      label.includes(ev.title.toLowerCase().slice(0, 14)) ||
      (ev.body && label.includes(ev.body.slice(0, 24).toLowerCase()));
    if (hit) return ev.sensitivity;
  }
  return 'internal';
}

export function nodeMatchesTrap(
  node: GraphNode,
  failedEvidenceIds: string[],
  evidence: EvidenceItem[],
): boolean {
  if (failedEvidenceIds.includes(node.id)) return true;
  const parent = node.properties?.parent;
  if (typeof parent === 'string' && failedEvidenceIds.includes(parent)) return true;

  const label = nodeLabel(node).toLowerCase();
  for (const eid of failedEvidenceIds) {
    if (label.includes(eid.toLowerCase())) return true;
    const ev = evidence.find((e) => e.id === eid);
    if (ev && label.includes(ev.title.toLowerCase().slice(0, 12))) return true;
  }
  return false;
}

export function mergeGraphData(
  primary: { nodes: GraphNode[]; links: GraphLink[] },
  enrich: { nodes: GraphNode[]; links: GraphLink[] },
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodeMap = new Map<string, GraphNode>();
  for (const n of [...primary.nodes, ...enrich.nodes]) {
    const prev = nodeMap.get(n.id);
    nodeMap.set(n.id, prev ? { ...prev, ...n, label: n.label ?? prev.label } : n);
  }

  const linkMap = new Map<string, GraphLink>();
  for (const l of [...primary.links, ...enrich.links]) {
    linkMap.set(linkId(l.source, l.target, l.label), l);
  }

  return { nodes: [...nodeMap.values()], links: [...linkMap.values()] };
}

export function synthesizeGraphFromEvidence(
  evidence: EvidenceItem[],
  caseName?: string,
  tests?: GraphTestInput[],
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const seenLinks = new Set<string>();
  const agentId = '__agent__';

  const addLink = (source: string, target: string, label: string) => {
    const key = linkId(source, target, label);
    if (seenLinks.has(key) || source === target) return;
    seenLinks.add(key);
    links.push({ source, target, label });
  };

  nodes.push({ id: agentId, label: caseName ?? 'Agent memory', type: 'Agent' });

  const kindNodes = new Map<string, string>();
  const sourceNodes = new Map<string, string>();
  const conceptNodes = new Map<string, string>();
  const categoryNodes = new Map<string, string>();

  const intentNodes = new Map<string, string>();

  for (const ev of evidence) {
    const dna = parseDnaFields(ev.body ?? '');
    nodes.push({
      id: ev.id,
      label: ev.title,
      type: 'Evidence',
      properties: {
        sensitivity: ev.sensitivity,
        kind: ev.kind,
        source: ev.source,
        intent: dna.intent,
        lineage: dna.lineage,
        entities: dna.entities,
        tier: dna.tier,
        body: (ev.body ?? '').slice(0, 240),
      },
    });
    addLink(agentId, ev.id, 'remembers');

    if (dna.intent) {
      for (const intent of dna.intent.split(/[|,]/).map((s) => s.trim()).filter(Boolean)) {
        const iid = intentNodes.get(intent.toLowerCase()) ?? slugId('intent', intent);
        if (!intentNodes.has(intent.toLowerCase())) {
          intentNodes.set(intent.toLowerCase(), iid);
          nodes.push({ id: iid, label: intent, type: 'Concept', properties: { searchIntent: intent } });
          addLink(agentId, iid, 'search_intent');
        }
        addLink(ev.id, iid, 'intent');
      }
    }

    if (dna.entities) {
      for (const ent of dna.entities.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 8)) {
        const eid = conceptNodes.get(ent.toLowerCase()) ?? slugId('concept', ent);
        if (!conceptNodes.has(ent.toLowerCase())) {
          conceptNodes.set(ent.toLowerCase(), eid);
          nodes.push({ id: eid, label: ent, type: 'Entity' });
        }
        addLink(ev.id, eid, 'dna_entity');
      }
    }

    if (ev.kind) {
      const kid = kindNodes.get(ev.kind) ?? slugId('kind', ev.kind);
      if (!kindNodes.has(ev.kind)) {
        kindNodes.set(ev.kind, kid);
        nodes.push({ id: kid, label: ev.kind, type: 'Kind' });
        addLink(agentId, kid, 'tracks');
      }
      addLink(ev.id, kid, 'typed_as');
    }

    if (ev.source) {
      const sid = sourceNodes.get(ev.source) ?? slugId('src', ev.source);
      if (!sourceNodes.has(ev.source)) {
        sourceNodes.set(ev.source, sid);
        nodes.push({ id: sid, label: ev.source, type: 'Source' });
      }
      addLink(ev.id, sid, 'from');
    }

    for (const chunk of chunkSentences(ev.body ?? '', ev.id)) {
      nodes.push(chunk);
      addLink(ev.id, chunk.id, 'contains');
      for (const term of extractTerms(chunk.label ?? '')) {
        const cid = conceptNodes.get(term.toLowerCase()) ?? slugId('concept', term);
        if (!conceptNodes.has(term.toLowerCase())) {
          conceptNodes.set(term.toLowerCase(), cid);
          nodes.push({ id: cid, label: term, type: 'Concept' });
        }
        addLink(chunk.id, cid, 'mentions');
        addLink(ev.id, cid, 'references');
      }
    }

    for (const term of extractTerms(ev.body ?? '')) {
      const cid = conceptNodes.get(term.toLowerCase()) ?? slugId('concept', term);
      if (!conceptNodes.has(term.toLowerCase())) {
        conceptNodes.set(term.toLowerCase(), cid);
        nodes.push({ id: cid, label: term, type: 'Concept' });
      }
      addLink(ev.id, cid, 'references');
    }
  }

  for (const t of tests ?? []) {
    const tid = `test-${t.id}`;
    nodes.push({ id: tid, label: t.title ?? t.id, type: 'Test' });
    addLink(agentId, tid, 'checks');

    if (t.category) {
      const catId = categoryNodes.get(t.category) ?? slugId('cat', t.category);
      if (!categoryNodes.has(t.category)) {
        categoryNodes.set(t.category, catId);
        nodes.push({ id: catId, label: t.category, type: 'Category' });
        addLink(agentId, catId, 'audits');
      }
      addLink(tid, catId, 'category');
    }

    for (const eid of t.evidenceIds ?? []) {
      if (evidence.some((e) => e.id === eid)) addLink(tid, eid, 'covers');
    }

    const related = evidence.find((e) =>
      t.title?.toLowerCase().includes(e.title.toLowerCase().slice(0, 8)),
    );
    if (related) addLink(tid, related.id, 'covers');
  }

  for (let i = 0; i < evidence.length - 1; i++) {
    addLink(evidence[i].id, evidence[i + 1].id, 'related');
  }

  const stale = evidence.filter((e) => /stale|old|superseded|draft|bad/i.test(`${e.title} ${e.risk}`));
  const fresh = evidence.filter((e) => /final|authoritative|decision|policy/i.test(`${e.title} ${e.risk}`));
  for (const s of stale) {
    for (const f of fresh) {
      if (s.id !== f.id) addLink(s.id, f.id, 'contradicts');
    }
  }

  const conceptHits = new Map<string, string[]>();
  for (const ev of evidence) {
    for (const term of extractTerms(ev.body ?? '')) {
      const key = term.toLowerCase();
      const list = conceptHits.get(key) ?? [];
      list.push(ev.id);
      conceptHits.set(key, list);
    }
  }
  for (const ids of conceptHits.values()) {
    for (let i = 0; i < ids.length - 1; i++) {
      addLink(ids[i], ids[i + 1], 'co-mentioned');
    }
  }

  return { nodes, links };
}

function computeDegrees(nodes: GraphNode[], links: GraphLink[]): Map<string, number> {
  const deg = new Map<string, number>();
  for (const n of nodes) deg.set(n.id, 0);
  for (const l of links) {
    deg.set(l.source, (deg.get(l.source) ?? 0) + 1);
    deg.set(l.target, (deg.get(l.target) ?? 0) + 1);
  }
  return deg;
}

export function getNeighborhood(
  nodeId: string,
  links: GraphLink[],
  depth = 1,
): Set<string> {
  const out = new Set<string>([nodeId]);
  let frontier = new Set([nodeId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const l of links) {
      if (frontier.has(l.source)) next.add(l.target);
      if (frontier.has(l.target)) next.add(l.source);
    }
    for (const id of next) out.add(id);
    frontier = next;
  }
  return out;
}

export function countByType(nodes: GraphNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    const t = n.type ?? 'node';
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

export function prepareGraphDisplay(
  rawNodes: GraphNode[],
  rawLinks: GraphLink[],
  evidence: EvidenceItem[],
  failedEvidenceIds: string[],
  highlightFail: boolean,
  options?: { typeFilter?: Set<string>; hideOrphans?: boolean },
): { nodes: GraphDisplayNode[]; links: GraphLink[]; totalRaw: number; typeCounts: Record<string, number> } {
  let filtered = rawNodes.filter((n) => !SKIP_TYPES.has(n.type ?? ''));
  if (!filtered.length) filtered = rawNodes;

  if (options?.typeFilter?.size) {
    filtered = filtered.filter((n) => options.typeFilter!.has(n.type ?? 'node'));
  }

  const totalRaw = filtered.length;
  const degrees = computeDegrees(filtered, rawLinks);

  if (options?.hideOrphans) {
    filtered = filtered.filter((n) => (degrees.get(n.id) ?? 0) > 0 || n.type === 'Agent');
  }

  const sorted = [...filtered].sort((a, b) => (degrees.get(b.id) ?? 0) - (degrees.get(a.id) ?? 0));
  const capped = MAX_GRAPH_NODES > 0 ? sorted.slice(0, MAX_GRAPH_NODES) : sorted;
  const idSet = new Set(capped.map((n) => n.id));

  const links = rawLinks.filter((l) => idSet.has(l.source) && idSet.has(l.target));

  const nodes: GraphDisplayNode[] = capped.map((n) => {
    const degree = degrees.get(n.id) ?? 0;
    const trapHit = highlightFail && nodeMatchesTrap(n, failedEvidenceIds, evidence);
    const sensitivity = trapHit ? 'trap' : sensitivityForNode(n, evidence);
    const typeColor = TYPE_COLORS[n.type ?? ''] ?? TYPE_COLORS.default;
    const color = trapHit ? SENS_COLORS.trap : (SENS_COLORS[sensitivity] ?? typeColor);
    return {
      ...n,
      label: nodeLabel(n),
      degree,
      val: Math.max(1, Math.min(28, 1 + degree * 1.6)),
      color,
      sensitivity,
      trapHit,
    };
  });

  return { nodes, links, totalRaw, typeCounts: countByType(capped) };
}

export function typeColor(type?: string): string {
  return TYPE_COLORS[type ?? ''] ?? TYPE_COLORS.default;
}

const GRAPH_CACHE = new Map<string, { nodes: GraphNode[]; links: GraphLink[]; ts: number }>();
const GRAPH_CACHE_TTL_MS = 30_000;

export function readGraphCache(caseId: string): { nodes: GraphNode[]; links: GraphLink[] } | null {
  const hit = GRAPH_CACHE.get(caseId);
  if (!hit || Date.now() - hit.ts > GRAPH_CACHE_TTL_MS) return null;
  return { nodes: hit.nodes, links: hit.links };
}

export function writeGraphCache(caseId: string, nodes: GraphNode[], links: GraphLink[]) {
  GRAPH_CACHE.set(caseId, { nodes, links, ts: Date.now() });
}

export function clearGraphCache(caseId?: string) {
  if (caseId) GRAPH_CACHE.delete(caseId);
  else GRAPH_CACHE.clear();
}

export function fetchGraphWithTimeout(
  fetcher: (caseId: string) => Promise<{ nodes?: GraphNode[]; edges?: GraphLink[] }>,
  caseId: string,
  ms = 12_000,
) {
  return Promise.race([
    fetcher(caseId),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Graph request timed out')), ms);
    }),
  ]);
}