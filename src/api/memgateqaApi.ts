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
    memgateMemory: boolean;
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
    geminiReachable?: boolean;
    model: string;
    geminiModels?: string[];
  };
  agents?: {
    cursor: { mcp: string; command: string };
    claude: { mcp: string; command: string };
    codex: { cli: string; autoAudit: string };
  };
  autoAudit?: boolean;
  memgateMemory: {
    engine: string;
    version: string;
    enabled: boolean;
    containers: number;
    documents: number;
    facts: number;
    searchModes: string[];
    mcpTools: string[];
  };
  mcp: {
    memgateqa: { transport: string; command: string; tools: string[] };
  };
  loopEngineering: {
    pattern: string;
    steps: { id: string; label: string; op: string }[];
    humanGate?: string[];
    loopReady?: boolean;
    repo: string;
  };
}

export interface MemoryProfileData {
  containerTag: string;
  profile: { static: string[]; dynamic: string[] };
  searchResults: { type: string; text: string; score: number }[];
  documentCount: number;
  activeFacts: number;
}

export interface HybridSearchData {
  mode: string;
  query: string;
  results: { type: string; id: string; text: string; score: number; source: string }[];
  localCount: number;
  cogneeUsed: boolean;
}

export interface LoopLedgerData {
  ledger: { t: string; stepId?: string; op?: string; detail?: string; message?: string }[];
  stateMd: string;
  loopMd: string;
}

export interface FullLoopResult {
  ok: boolean;
  ticks: { stepId: string; detail: string }[];
  pendingPlan?: string;
  shipReady?: boolean;
  health?: number;
  loopReadyScore?: number;
}

export interface AutoLoopStatus {
  caseId: string;
  running: boolean;
  intervalSec: number;
  lastRunAt?: string;
  lastResult?: FullLoopResult;
  runCount: number;
  nextStep?: string;
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
    loopReadyScore?: number;
    lastStep?: string;
    steps: { id: string; label: string; op: string }[];
  };
  detail: string;
  humanGate?: boolean;
}

export interface AgentGapFillResult {
  plan: string;
  provider?: string;
  failureCount: number;
}

export interface AutoAgentLogEntry {
  t: string;
  step: string;
  status: 'ok' | 'warn' | 'fail' | 'skip';
  detail: string;
}

export interface AutoAgentResult {
  ok: boolean;
  caseId: string;
  health?: number;
  shipReady?: boolean;
  status?: string;
  pendingRepairPlan?: string;
  log: AutoAgentLogEntry[];
  scheduler?: AutoLoopStatus;
  auditSteps?: unknown[];
  error?: string;
}

export interface FleetAutoAgentResult {
  ok: boolean;
  ran: number;
  shipReady: number;
  results: (AutoAgentResult & { name?: string })[];
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

  memoryProfile: (caseId: string, query?: string) => {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<MemoryProfileData>(`/api/cases/${caseId}/memory/profile${q}`);
  },

  memorySearch: (caseId: string, query: string, mode = 'hybrid') =>
    request<HybridSearchData>(`/api/cases/${caseId}/memory/search`, {
      method: 'POST',
      body: JSON.stringify({ query, mode }),
    }),

  memoryContext: (caseId: string) =>
    request<{ context: string; containerTag: string }>(`/api/cases/${caseId}/memory/context`),

  loopLedger: (caseId: string) =>
    request<LoopLedgerData>(`/api/cases/${caseId}/loop/ledger`),

  runFullLoop: (caseId: string) =>
    request<FullLoopResult>(`/api/cases/${caseId}/loop/run-full`, { method: 'POST' }),

  autoLoopStart: (caseId: string, intervalSec = 120) =>
    request<AutoLoopStatus>(`/api/cases/${caseId}/loop/auto/start`, {
      method: 'POST',
      body: JSON.stringify({ intervalSec }),
    }),

  autoLoopStop: (caseId: string) =>
    request<AutoLoopStatus>(`/api/cases/${caseId}/loop/auto/stop`, { method: 'POST' }),

  autoLoopStatus: (caseId: string) =>
    request<AutoLoopStatus>(`/api/cases/${caseId}/loop/auto/status`),

  autoAudit: (caseId: string, force = false) =>
    request<{
      ok: boolean;
      health?: number;
      shipReady?: boolean;
      pendingRepairPlan?: string;
      steps: unknown[];
    }>(`/api/cases/${caseId}/audit/auto${force ? '?force=true' : ''}`, { method: 'POST' }),

  runAutoAgent: (
    caseId: string,
    opts?: { applyRepair?: boolean; startAutoLoop?: boolean; intervalSec?: number; forceReindex?: boolean },
  ) =>
    request<AutoAgentResult>(`/api/cases/${caseId}/agent/run-all`, {
      method: 'POST',
      body: JSON.stringify({
        applyRepair: opts?.applyRepair ?? true,
        startAutoLoop: opts?.startAutoLoop ?? true,
        intervalSec: opts?.intervalSec ?? 120,
        forceReindex: opts?.forceReindex ?? false,
      }),
    }),

  runFleetAutoAgent: (
    opts?: { applyRepair?: boolean; startAutoLoop?: boolean; intervalSec?: number; forceReindex?: boolean },
  ) =>
    request<FleetAutoAgentResult>('/api/agent/run-fleet', {
      method: 'POST',
      body: JSON.stringify({
        applyRepair: opts?.applyRepair ?? true,
        startAutoLoop: opts?.startAutoLoop ?? true,
        intervalSec: opts?.intervalSec ?? 120,
        forceReindex: opts?.forceReindex ?? false,
      }),
    }),
};