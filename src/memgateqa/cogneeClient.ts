import type { EvidenceDocument, MemoryTest } from './types';

export interface CogneeProxyResponse<T> {
  ok: boolean;
  mode: 'mock' | 'proxy';
  data: T;
  detail?: string;
}

export interface RecallHit {
  answer: string;
  source: string;
  raw?: unknown;
}

const proxyUrl = import.meta.env.VITE_COGNEE_PROXY_URL as string | undefined;
const mockMode = String(import.meta.env.VITE_MEMGATEQA_MOCK ?? 'true') !== 'false';

async function postToProxy<T>(path: string, payload: unknown): Promise<CogneeProxyResponse<T>> {
  if (!proxyUrl || mockMode) {
    return {
      ok: true,
      mode: 'mock',
      data: payload as T,
      detail: 'Mock mode is active. Set VITE_MEMGATEQA_MOCK=false and VITE_COGNEE_PROXY_URL to call a Cognee bridge.',
    };
  }

  const response = await fetch(`${proxyUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Cognee proxy ${path} failed with ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  return response.json() as Promise<CogneeProxyResponse<T>>;
}

export async function rememberEvidence(dataset: string, evidence: EvidenceDocument[]) {
  return postToProxy('/remember', { dataset, evidence });
}

export async function recallForTest(dataset: string, test: MemoryTest): Promise<RecallHit[]> {
  if (!proxyUrl || mockMode) {
    return [];
  }
  const response = await postToProxy<{ results: RecallHit[] }>('/recall', { dataset, test });
  return response.data?.results ?? [];
}

export async function improveMemory(dataset: string, instruction: string, approvedByHuman = true) {
  return postToProxy('/improve', { dataset, instruction, approvedByHuman });
}

export async function forgetPrivateEvidence(dataset: string, evidenceIds: string[]) {
  return postToProxy('/forget', { dataset, evidenceIds });
}

export function isLiveMode(): boolean {
  return !mockMode && Boolean(proxyUrl);
}