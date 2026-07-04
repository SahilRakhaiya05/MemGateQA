const BASE = (import.meta.env.VITE_COGNEE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8788';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `API ${path} failed (${response.status})`);
  }
  const json = await response.json();
  return json.data as T;
}

export interface CaseRecord {
  id: string;
  name: string;
  agent: string;
  dataset: string;
  description: string;
  status: string;
  evidence: EvidenceItem[];
  tests: TestItem[];
  resultsBefore: TestResult[];
  resultsAfter: TestResult[];
  reports: unknown[];
  lastScore?: number;
  lastBreakdown?: HealthBreakdown;
  cogneeDataIds?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  body: string;
  kind: string;
  date: string;
  source: string;
  sensitivity: string;
  shouldRemember: boolean;
  shouldForget: boolean;
  risk: string;
}

export interface TestItem {
  id: string;
  title: string;
  category: string;
  question: string;
  expected: string;
  trap?: string;
  severity: string;
  evidenceIds: string[];
  repairAction: string;
  weight: number;
}

export interface TestResult {
  testId: string;
  status: 'pass' | 'fail' | 'fixed';
  actual: string;
  reason: string;
  confidence: number;
  evidence: { sourceId: string; quote: string; confidence: number }[];
  beforeScore: number;
  afterScore?: number;
}

export interface HealthBreakdown {
  evidenceGrounding: number;
  freshness: number;
  premiseResistance: number;
  contradictionConsistency: number;
  privacyLeakResistance: number;
  forgetSuccess: number;
}

export interface BridgeHealth {
  ok: boolean;
  mode: string;
  cognee_reachable: boolean;
  case_count: number;
  dataset?: string;
  session_id?: string;
  integrations?: {
    llm: string;
    openai: boolean;
    gemini: boolean;
    supermemory: boolean;
    mcp_memgateqa: boolean;
  };
}

export interface IntegrationsSnapshot {
  cognee: {
    reachable: boolean;
    baseUrl: string;
    dataset: string;
    sessionId?: string;
  };
  llm: {
    provider: string;
    openai: boolean;
    gemini: boolean;
    model: string;
  };
  supermemory: {
    enabled: boolean;
    baseUrl: string;
    mcpUrl: string;
  };
  mcp: {
    memgateqa: { transport: string; command: string; tools: string[] };
    supermemory: { url: string; docs: string };
  };
  loopEngineering: {
    pattern: string;
    steps: { id: string; label: string; op: string }[];
    repo: string;
  };
}

export interface AgentChatResult {
  answer: string;
  provider?: string;
  model?: string;
  recallPreview?: string;
  references?: unknown[];
}

export interface AgentLoopResult {
  step: { id: string; label: string; op: string };
  state: {
    caseId: string;
    status: string;
    health: number;
    trapCount: number;
    failCount: number;
    shipReady: boolean;
    steps: { id: string; label: string; op: string }[];
  };
  detail: string;
}

export interface AgentGapFillResult {
  plan: string;
  provider?: string;
  failureCount: number;
}

export interface CogneeOpEntry {
  op: string;
  dataset: string;
  ms: number;
  ok: boolean;
  detail?: string;
  t: number;
}

export interface GraphData {
  nodes: { id: string; label?: string; type?: string }[];
  edges: { source: string; target: string; label?: string }[];
}

export interface CompareResult {
  testId: string;
  question: string;
  rag: { answer: string; grade: TestResult };
  graph: { answer: string; grade: TestResult; references: unknown[] };
}

export const api = {
  health: () => fetch(`${BASE}/health`).then((r) => r.json() as Promise<BridgeHealth>),

  listCases: () => request<CaseRecord[]>('/api/cases'),

  getCase: (id: string) => request<CaseRecord>(`/api/cases/${id}`),

  createCase: (body: { name: string; agent: string; dataset: string; description?: string }) =>
    request<CaseRecord>('/api/cases', { method: 'POST', body: JSON.stringify(body) }),

  deleteCase: (id: string) => request<{ deleted: string }>(`/api/cases/${id}`, { method: 'DELETE' }),

  addEvidence: (caseId: string, doc: Partial<EvidenceItem>) =>
    request<EvidenceItem>(`/api/cases/${caseId}/evidence`, { method: 'POST', body: JSON.stringify(doc) }),

  deleteEvidence: (caseId: string, evidenceId: string) =>
    request<{ deleted: string }>(`/api/cases/${caseId}/evidence/${evidenceId}`, { method: 'DELETE' }),

  addTest: (caseId: string, test: Partial<TestItem>) =>
    request<TestItem>(`/api/cases/${caseId}/tests`, { method: 'POST', body: JSON.stringify(test) }),

  deleteTest: (caseId: string, testId: string) =>
    request<{ deleted: string }>(`/api/cases/${caseId}/tests/${testId}`, { method: 'DELETE' }),

  remember: (caseId: string) =>
    request<{ stored: string[]; dataset: string }>(`/api/cases/${caseId}/remember`, { method: 'POST' }),

  interrogate: (caseId: string) =>
    request<{ results: TestResult[]; score: number; breakdown: HealthBreakdown }>(
      `/api/cases/${caseId}/interrogate`,
      { method: 'POST' },
    ),

  surgery: (caseId: string, body: { dataset: string; instruction: string; evidenceIds: string[] }) =>
    request<{ surgery: string }>(`/api/cases/${caseId}/surgery`, {
      method: 'POST',
      body: JSON.stringify({ ...body, approvedByHuman: true }),
    }),

  rerun: (caseId: string) =>
    request<{ results: TestResult[]; score: number; breakdown: HealthBreakdown }>(
      `/api/cases/${caseId}/rerun`,
      { method: 'POST' },
    ),

  report: (caseId: string) =>
    request<{
      scoreBefore: number | null;
      scoreAfter: number | null;
      breakdownBefore: HealthBreakdown;
      breakdownAfter: HealthBreakdown;
      resultsBefore: TestResult[];
      resultsAfter: TestResult[];
    }>(`/api/cases/${caseId}/report`),

  getGraph: (caseId: string) => request<GraphData>(`/api/cases/${caseId}/graph`),

  getOps: (caseId: string) => request<CogneeOpEntry[]>(`/api/cases/${caseId}/ops`),

  compare: (caseId: string, testId: string) =>
    request<CompareResult>(`/api/cases/${caseId}/compare`, {
      method: 'POST',
      body: JSON.stringify({ testId }),
    }),

  integrations: () => request<IntegrationsSnapshot>('/api/integrations'),

  agentChat: (caseId: string, message: string) =>
    request<AgentChatResult>(`/api/cases/${caseId}/agent/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  agentLoop: (caseId: string, stepId: string) =>
    request<AgentLoopResult>(`/api/cases/${caseId}/agent/loop`, {
      method: 'POST',
      body: JSON.stringify({ stepId }),
    }),

  agentGapFill: (caseId: string) =>
    request<AgentGapFillResult>(`/api/cases/${caseId}/agent/gap-fill`, { method: 'POST' }),
};