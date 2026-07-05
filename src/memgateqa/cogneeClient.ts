import type { EvidenceDocument, MemoryTest } from './types';

export interface CogneeProxyResponse<T> {
  ok: boolean;
  mode: 'proxy' | 'offline';
  data: T;
  detail?: string;
}

export interface RecallHit {
  answer: string;
  source: string;
  raw?: unknown;
}

const proxyUrl = import.meta.env.VITE_COGNEE_PROXY_URL as string | undefined;

async function postToProxy<T>(path: string, payload: unknown): Promise<CogneeProxyResponse<T>> {
  if (!proxyUrl) {
    throw new Error('Cognee bridge not configured. Set VITE_COGNEE_PROXY_URL and run start.ps1.');
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
  if (!proxyUrl) {
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
  return Boolean(proxyUrl);
}