/**
 * MemGateQA SDK — native memory engine + loop + Cognee bridge client.
 * Replicates Supermemory-style memory/recall/context + loop-engineering ticks.
 */

const BASE = (import.meta.env.VITE_COGNEE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8788';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => `SDK ${path} failed`));
  const json = await res.json();
  return json.data as T;
}

export interface MemoryProfile {
  containerTag: string;
  profile: { static: string[]; dynamic: string[] };
  searchResults: { type: string; text: string; score: number }[];
  documentCount: number;
  activeFacts: number;
}

export interface HybridSearchResult {
  mode: string;
  query: string;
  results: { type: string; id: string; text: string; score: number; source: string }[];
  localCount: number;
  cogneeUsed: boolean;
}

export interface LoopLedgerEntry {
  t: string;
  stepId?: string;
  label?: string;
  op?: string;
  detail?: string;
}

export class MemGateSdk {
  constructor(private readonly caseId: string) {}

  /** Supermemory-pattern: save a memory fact */
  memory(content: string, kind = 'sdk') {
    return request<{ ok: boolean; factId: string }>(`/api/cases/${this.caseId}/memory/add`, {
      method: 'POST',
      body: JSON.stringify({ content, kind }),
    });
  }

  /** Supermemory-pattern: hybrid recall */
  recall(query: string, mode: 'hybrid' | 'memories' | 'documents' = 'hybrid') {
    return request<HybridSearchResult>(`/api/cases/${this.caseId}/memory/search`, {
      method: 'POST',
      body: JSON.stringify({ query, mode }),
    });
  }

  /** Supermemory-pattern: inject context profile */
  context() {
    return request<{ context: string; containerTag: string }>(`/api/cases/${this.caseId}/memory/context`);
  }

  profile(query?: string) {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<MemoryProfile>(`/api/cases/${this.caseId}/memory/profile${q}`);
  }

  /** Loop-engineering: run one tick */
  loopTick(stepId: 'observe' | 'recall' | 'grade' | 'plan' | 'verify') {
    return request(`/api/cases/${this.caseId}/agent/loop`, {
      method: 'POST',
      body: JSON.stringify({ stepId }),
    });
  }

  agentChat(message: string) {
    return request(`/api/cases/${this.caseId}/agent/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  ledger(limit = 20) {
    return request<{ ledger: LoopLedgerEntry[]; stateMd: string; loopMd: string }>(
      `/api/cases/${this.caseId}/loop/ledger?limit=${limit}`,
    );
  }

  runFullLoop() {
    return request(`/api/cases/${this.caseId}/loop/run-full`, { method: 'POST' });
  }

  autoLoopStart(intervalSec = 120) {
    return request(`/api/cases/${this.caseId}/loop/auto/start`, {
      method: 'POST',
      body: JSON.stringify({ intervalSec }),
    });
  }

  autoLoopStop() {
    return request(`/api/cases/${this.caseId}/loop/auto/stop`, { method: 'POST' });
  }

  autoLoopStatus() {
    return request(`/api/cases/${this.caseId}/loop/auto/status`);
  }
}

export function createMemGateSdk(caseId: string) {
  return new MemGateSdk(caseId);
}