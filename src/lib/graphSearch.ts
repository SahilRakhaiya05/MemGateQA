import type { GraphDisplayNode } from './graphModel';

export interface GraphSearchHit {
  node: GraphDisplayNode;
  score: number;
  matchedFields: string[];
  snippet: string;
}

export interface GraphSearchParse {
  text: string;
  type?: string;
  intent?: string;
  sensitivity?: string;
  kind?: string;
  id?: string;
}

const FIELD_WEIGHTS: Record<string, number> = {
  id: 120,
  label: 100,
  type: 80,
  intent: 90,
  sensitivity: 70,
  kind: 65,
  source: 55,
  parent: 40,
  body: 35,
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function tokens(q: string): string[] {
  return normalize(q)
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Obsidian-style query: type:evidence intent:pricing postgres */
export function parseGraphQuery(raw: string): GraphSearchParse {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  const out: GraphSearchParse = { text: '' };
  const free: string[] = [];

  for (const p of parts) {
    const lower = p.toLowerCase();
    if (lower.startsWith('type:')) out.type = lower.slice(5);
    else if (lower.startsWith('intent:')) out.intent = lower.slice(7);
    else if (lower.startsWith('sensitivity:') || lower.startsWith('sens:')) {
      out.sensitivity = lower.includes(':') ? lower.split(':').slice(1).join(':') : '';
    } else if (lower.startsWith('kind:')) out.kind = lower.slice(5);
    else if (lower.startsWith('id:')) out.id = p.slice(3);
    else free.push(p);
  }

  out.text = free.join(' ');
  return out;
}

function fieldValue(node: GraphDisplayNode, field: string): string {
  const props = node.properties ?? {};
  switch (field) {
    case 'id':
      return node.id;
    case 'label':
      return node.label ?? '';
    case 'type':
      return node.type ?? '';
    case 'intent':
      return String(props.intent ?? props.searchIntent ?? '');
    case 'sensitivity':
      return node.sensitivity ?? String(props.sensitivity ?? '');
    case 'kind':
      return String(props.kind ?? '');
    case 'source':
      return String(props.source ?? '');
    case 'parent':
      return String(props.parent ?? '');
    case 'body':
      return String(props.body ?? props.dna ?? '');
    default:
      return '';
  }
}

function subsequenceScore(hay: string, needle: string): number {
  if (!needle) return 0;
  let hi = 0;
  let matches = 0;
  for (let ni = 0; ni < needle.length; ni++) {
    const ch = needle[ni];
    while (hi < hay.length && hay[hi] !== ch) hi++;
    if (hi >= hay.length) return 0;
    matches++;
    hi++;
  }
  return (matches / needle.length) * 40;
}

function scoreField(hayRaw: string, query: string): number {
  const hay = normalize(hayRaw);
  const q = normalize(query);
  if (!q || !hay) return 0;
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 85;
  if (hay.includes(q)) return 60;
  return subsequenceScore(hay, q);
}

function buildSnippet(node: GraphDisplayNode, query: string): string {
  const label = node.label ?? node.id;
  const q = normalize(query);
  if (!q) return label.slice(0, 72);
  const idx = normalize(label).indexOf(q);
  if (idx >= 0) {
    const start = Math.max(0, idx - 12);
    return `${start > 0 ? '…' : ''}${label.slice(start, start + 72)}${label.length > start + 72 ? '…' : ''}`;
  }
  return label.slice(0, 72);
}

export function searchGraphNodes(
  nodes: GraphDisplayNode[],
  rawQuery: string,
  limit = 24,
): GraphSearchHit[] {
  const q = rawQuery.trim();
  if (!q) return [];

  const parsed = parseGraphQuery(q);
  const textTokens = tokens(parsed.text);
  const hits: GraphSearchHit[] = [];

  for (const node of nodes) {
    let score = 0;
    const matchedFields: string[] = [];

    if (parsed.type) {
      const t = normalize(node.type ?? '');
      if (t === parsed.type || t.includes(parsed.type)) {
        score += 400;
        matchedFields.push('type');
      } else continue;
    }
    if (parsed.intent) {
      const intent = normalize(fieldValue(node, 'intent'));
      if (intent.includes(parsed.intent)) {
        score += 420;
        matchedFields.push('intent');
      } else continue;
    }
    if (parsed.sensitivity) {
      const sens = normalize(fieldValue(node, 'sensitivity'));
      if (sens === parsed.sensitivity || sens.includes(parsed.sensitivity)) {
        score += 380;
        matchedFields.push('sensitivity');
      } else continue;
    }
    if (parsed.kind) {
      const kind = normalize(fieldValue(node, 'kind'));
      if (kind.includes(parsed.kind)) {
        score += 360;
        matchedFields.push('kind');
      } else continue;
    }
    if (parsed.id) {
      const id = normalize(node.id);
      if (id === normalize(parsed.id) || id.includes(normalize(parsed.id))) {
        score += 1000;
        matchedFields.push('id');
      } else continue;
    }

    for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
      const val = fieldValue(node, field);
      if (!val) continue;
      const fs = scoreField(val, parsed.text || q);
      if (fs > 0) {
        score += fs * (weight / 100);
        matchedFields.push(field);
      }
    }

    if (textTokens.length > 1) {
      const blob = normalize(
        [node.id, node.label, node.type, ...Object.values(node.properties ?? {})].join(' '),
      );
      const allHit = textTokens.every((t) => blob.includes(t));
      if (allHit) score += 80 + textTokens.length * 10;
      else if (textTokens.length > 1 && score < 50) continue;
    }

    if (score > 0) {
      hits.push({
        node,
        score,
        matchedFields: [...new Set(matchedFields)],
        snippet: buildSnippet(node, parsed.text || q),
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || (b.node.degree - a.node.degree))
    .slice(0, limit);
}

export function matchIdsFromHits(hits: GraphSearchHit[]): Set<string> {
  return new Set(hits.map((h) => h.node.id));
}