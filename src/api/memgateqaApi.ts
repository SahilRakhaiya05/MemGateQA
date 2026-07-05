const ENV_BASE = (import.meta.env.VITE_COGNEE_PROXY_URL as string | undefined)?.replace(/\/$/, '');
/** Use same-origin proxy in dev (vite.config.ts) unless explicit URL set. */
const BASE = ENV_BASE || (import.meta.env.DEV ? '' : 'http://localhost:8788');

export function parseApiError(body: string, status: number, path: string): string {
  try {
    const j = JSON.parse(body) as { detail?: string };
    if (j.detail === 'Not Found' && path.includes('/gate/')) {
      return 'Bridge is outdated — stop the old server and run .\\start.ps1 again (gate routes missing).';
    }
    if (j.detail === 'Not Found' && path.includes('/api/agents/')) {
      return 'Bridge is outdated — stop the old server and run .\\start.ps1 again (agent routes missing).';
    }
    if (j.detail === 'Not Found' && path.includes('/api/settings')) {
      return 'Bridge is outdated — stop the old server and run .\\start.ps1 again (settings routes missing).';
    }
    if (j.detail) return j.detail;
  } catch {
    /* not json */
  }
  return body || `API ${path} failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(parseApiError(detail, response.status, path));
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
  pendingRepairPlan?: string;
  templateId?: string;
  llmProvider?: string;
  llmModel?: string;
  modelTier?: string;
  persona?: string;
  modalities?: string[];
  ownerId?: string;
  visibility?: 'private' | 'public' | 'unlisted';
  publishSlug?: string;
  publishedAt?: string;
  agentStatus?: 'draft' | 'published';
  chatHistory?: { role: string; content: string; t?: string; provider?: string; model?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicAgentView {
  id: string;
  name: string;
  agent: string;
  description: string;
  templateId?: string;
  dataset: string;
  lastScore?: number;
  status: string;
  visibility?: string;
  publishSlug?: string;
  publishedAt?: string;
  modalities?: string[];
  modelTier?: string;
  llmProvider?: string;
  evidenceCount: number;
  trapCount: number;
  evidence: { id: string; title: string; body: string; sensitivity: string }[];
  shipReady: boolean;
}

export interface PublishResult {
  caseId: string;
  publishSlug: string;
  visibility: string;
  publishedAt?: string;
  sharePath: string;
}

export interface AgentScaffold {
  agentName: string;
  purpose: string;
  persona: string;
  evidence: { id: string; title: string; body: string; sensitivity: string }[];
  tests: { id: string; title: string; question: string; expected: string; category: string }[];
}

export interface BuilderChatResult {
  reply: string;
  readyToCreate: boolean;
  scaffold: AgentScaffold | null;
  provider?: string;
  model?: string;
}

export interface MyAgentSummary {
  id: string;
  agent: string;
  name: string;
  templateId?: string;
  lastScore?: number;
  visibility: string;
  publishSlug?: string;
  agentStatus: string;
  sharePath?: string | null;
  updatedAt?: string;
  dataset?: string;
  trapCount?: number;
  evidenceCount?: number;
  openFailures?: number;
}

export interface IngestParseResult {
  chunks: { title: string; body: string; source?: string; sensitivity?: string }[];
  charCount: number;
  source: string;
  chunkCount?: number;
}

export interface WorkspaceSettings {
  llm: {
    provider: string;
    model: string;
    openaiApiKey: string;
    geminiApiKey: string;
    openaiModel: string;
    geminiModel: string;
    openaiApiKeySet?: boolean;
    geminiApiKeySet?: boolean;
  };
  cognee: {
    baseUrl: string;
    apiKey: string;
    sessionId: string;
    defaultDataset: string;
    apiKeySet?: boolean;
  };
  mcp: {
    enabled: boolean;
    bridgeUrl: string;
  };
  gate: {
    autonomous: boolean;
    maxRepairCycles: number;
    autoCertify: boolean;
  };
  webhooks?: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[];
    secretSet?: boolean;
  };
}

export interface WebhookTestResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  status?: number;
  event?: string;
  error?: string;
}

export interface WorkspaceStatus {
  cogneeReachable: boolean;
  llmProvider: string;
  llmModel: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  traps: number;
  evidence: number;
  featured?: boolean;
  category?: string;
  modalities?: string[];
  recommendedTier?: string;
  chatPrompts?: string[];
}

export interface ModelTier {
  id: string;
  label: string;
  hint: string;
  openaiModels: string[];
  geminiModels: string[];
}

export interface AgentChatHistoryData {
  history: { role: string; content: string; provider?: string; model?: string; recallPreview?: string }[];
  welcome?: string;
  chatPrompts?: string[];
  modelTier?: string;
  llmProvider?: string;
  llmModel?: string;
}

export interface AgentCreateResult {
  case: CaseRecord;
  templateId: string;
  dataset: string;
  evidenceCount: number;
  trapCount: number;
  launched: boolean;
  gate?: AutonomousGateResult;
}

export interface AgentLaunchResult {
  case: CaseRecord;
  gate: AutonomousGateResult;
  dataset: string;
  health?: number;
  shipReady: boolean;
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
  references?: { id?: string; chunkId?: string; dataId?: string; sourceId?: string; source?: string }[];
  citedIds?: string[];
  searchType?: string;
  nodeSetScope?: string;
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
  bridge_version?: string;
  capabilities?: string[];
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

export interface DeveloperMcpTool {
  name: string;
  category: string;
  description: string;
  cogneeOp: string | null;
  argsExample: Record<string, unknown>;
  sdkCall: string;
}

export interface DeveloperManifest {
  cogneeLinks: Record<string, string>;
  cogneeValue: { op: string; cognee: string; memgateqa: string; helps: string }[];
  architectureFlow: string[];
  pitch: string;
  mcp: {
    transport: string;
    server: string;
    bridgeEnv: string;
    toolCount: number;
    tools: DeveloperMcpTool[];
    config: Record<string, unknown>;
  };
  cli: {
    entry: string;
    npm: string;
    groups: { group: string; commands: { cmd: string; desc: string; maps: string }[] }[];
  };
  sdk: {
    entry: string;
    factory: string;
    methods: { method: string; desc: string; example: string; cognee: string | null }[];
  };
  agentSetup: { id: string; name: string; icon: string; steps: string[]; configFile: string }[];
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
  tier?: string;
  recallPreview?: string;
  references?: unknown[];
  chatPrompts?: string[];
  historyLength?: number;
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

export interface AutonomousGateLogEntry {
  t: string;
  phase: string;
  level: string;
  message: string;
}

export interface AutonomousGateStatus {
  caseId: string;
  running: boolean;
  watching?: boolean;
  phase: string | null;
  health: number | null;
  shipReady: boolean;
  log: AutonomousGateLogEntry[];
  cycles?: number;
  autonomousEnabled?: boolean;
}

export interface AutonomousGateResult {
  ok: boolean;
  health?: number;
  shipReady?: boolean;
  repairCycles?: number;
  log: AutonomousGateLogEntry[];
  pendingRepairPlan?: string;
  error?: string;
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

  getSettings: () =>
    request<{ settings: WorkspaceSettings; status: WorkspaceStatus }>('/api/settings'),

  saveSettings: (settings: WorkspaceSettings) =>
    request<WorkspaceSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  testWebhook: (event: string, payload?: Record<string, unknown>) =>
    request<WebhookTestResult>('/api/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ event, payload: payload ?? {} }),
    }),

  listLlmModels: (provider: string) =>
    request<{ provider: string; models: string[] }>(
      `/api/settings/llm/models?provider=${encodeURIComponent(provider)}`,
    ).then((d) => d.models),

  testLlm: (body?: { provider?: string; model?: string }) =>
    request<{ ok: boolean; provider?: string; model?: string; sample?: string; error?: string }>(
      '/api/settings/test/llm',
      { method: 'POST', body: JSON.stringify(body ?? {}) },
    ),

  testCognee: (body?: { baseUrl?: string; apiKey?: string; sessionId?: string }) =>
    request<{ ok: boolean; status?: number; datasetCount?: number; error?: string }>(
      '/api/settings/test/cognee',
      { method: 'POST', body: JSON.stringify(body ?? {}) },
    ),

  listAgentTemplates: () => request<AgentTemplate[]>('/api/agents/templates'),

  listModelTiers: () => request<ModelTier[]>('/api/llm/model-tiers'),

  builderChat: (body: {
    messages: { role: string; content: string }[];
    llmProvider?: string;
    llmModel?: string;
    modelTier?: string;
  }) =>
    request<BuilderChatResult>('/api/agents/builder/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createAgentFromChat: (body: {
    scaffold: AgentScaffold;
    ownerId?: string;
    llmProvider?: string;
    llmModel?: string;
    modelTier?: string;
    indexMemory?: boolean;
  }) =>
    request<{ case: CaseRecord; indexed: boolean; evidenceCount: number }>(
      '/api/agents/create-from-chat',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  createAgent: (body: {
    agentName: string;
    templateId?: string;
    dataset?: string;
    llmProvider?: string;
    llmModel?: string;
    modelTier?: string;
    ownerId?: string;
    launch?: boolean;
    indexMemory?: boolean;
  }) =>
    request<AgentCreateResult>('/api/agents/create', { method: 'POST', body: JSON.stringify(body) }),

  updateAgentConfig: (
    caseId: string,
    body: { llmProvider?: string; llmModel?: string; modelTier?: string },
  ) =>
    request<{ case: CaseRecord; llm: { provider: string; model: string } }>(
      `/api/agents/${caseId}/config`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),

  publishAgent: (caseId: string, body: { ownerId?: string; visibility: 'public' | 'unlisted' | 'private' }) =>
    request<PublishResult>(`/api/agents/${caseId}/publish`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listMyAgents: (ownerId?: string) =>
    request<MyAgentSummary[]>(`/api/agents/mine${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''}`),

  parseEvidence: (body: { text?: string; url?: string; filename?: string }) =>
    request<IngestParseResult>('/api/evidence/parse', { method: 'POST', body: JSON.stringify(body) }),

  getPublicAgent: (slug: string) => request<PublicAgentView>(`/api/public/agents/${slug}`),

  publicAgentChat: (slug: string, message: string, history?: { role: string; content: string }[]) =>
    request<AgentChatResult>(`/api/public/agents/${slug}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history: history ?? [] }),
    }),

  launchAgent: (
    caseId: string,
    opts?: {
      forceReindex?: boolean;
      maxRepairCycles?: number;
      autoCertify?: boolean;
      startWatch?: boolean;
      watchIntervalSec?: number;
    },
  ) =>
    request<AgentLaunchResult>(`/api/agents/${caseId}/launch`, {
      method: 'POST',
      body: JSON.stringify({
        forceReindex: opts?.forceReindex ?? true,
        maxRepairCycles: opts?.maxRepairCycles ?? 1,
        autoCertify: opts?.autoCertify ?? true,
        startWatch: opts?.startWatch ?? false,
        watchIntervalSec: opts?.watchIntervalSec ?? 180,
      }),
    }),

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

  surgery: (
    caseId: string,
    body: { dataset: string; instruction: string; evidenceIds: string[]; actorRole?: 'owner' | 'reviewer' },
  ) =>
    request<{ surgery: string; actorRole?: string; rbacGate?: boolean }>(`/api/cases/${caseId}/surgery`, {
      method: 'POST',
      body: JSON.stringify({ ...body, approvedByHuman: true, actorRole: body.actorRole ?? 'owner' }),
    }),

  rbacStatus: () =>
    request<{ available: boolean; demoRoles: string[]; gate: string }>('/api/integrations/rbac'),

  downloadProofBundle: async (caseId: string) => {
    const base = (import.meta.env.VITE_COGNEE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8788';
    const res = await fetch(`${base}/api/cases/${caseId}/proof-bundle`);
    if (!res.ok) throw new Error('Proof bundle download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memgateqa-${caseId}-proof.zip`;
    a.click();
    URL.revokeObjectURL(url);
  },

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
    }>(`/api/cases/${caseId}/report`, { method: 'POST' }),

  getGraph: (caseId: string) => request<GraphData>(`/api/cases/${caseId}/graph`),

  wikiAudit: (caseId: string) =>
    request<{
      caseId: string;
      nodeCount: number;
      edgeCount: number;
      evidenceCount: number;
      trapCount: number;
      openFailures: number;
      healthScore?: number;
      shipReady: boolean;
    }>(`/api/cases/${caseId}/wiki/audit`),

  getSchemaInventory: (caseId: string) =>
    request<{ total_entities?: number; types?: { type: string; count: number }[]; mock?: boolean }>(
      `/api/cases/${caseId}/schema/inventory`,
    ),

  getSchemaProvenance: (caseId: string, includeMemory = false) =>
    request<Record<string, unknown>>(
      `/api/cases/${caseId}/schema/provenance?include_memory=${includeMemory}`,
    ),

  getOps: (caseId: string) => request<CogneeOpEntry[]>(`/api/cases/${caseId}/ops`),

  compare: (caseId: string, testId: string) =>
    request<CompareResult>(`/api/cases/${caseId}/compare`, {
      method: 'POST',
      body: JSON.stringify({ testId }),
    }),

  replyGate: (caseId: string, message: string) =>
    request<{
      verdict: 'SHIP' | 'BLOCK';
      shipReady: boolean;
      recallAnswer: string;
      failures: { testId: string; title?: string; category?: string; reason: string }[];
      trapResults: { testId: string; title?: string; status: string; reason: string }[];
      checked: number;
    }>(`/api/cases/${caseId}/reply-gate`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  integrations: () => request<IntegrationsSnapshot>('/api/integrations'),

  developerManifest: () => request<DeveloperManifest>('/api/integrations/developer'),

  mcpConfig: () => request<Record<string, unknown>>('/api/integrations/mcp-config'),

  agentChatHistory: (caseId: string) =>
    request<AgentChatHistoryData>(`/api/cases/${caseId}/agent/chat/history`),

  clearAgentChat: (caseId: string) =>
    request<{ cleared: boolean }>(`/api/cases/${caseId}/agent/chat/history`, { method: 'DELETE' }),

  agentChat: (caseId: string, message: string, history?: { role: string; content: string }[]) =>
    request<AgentChatResult>(`/api/cases/${caseId}/agent/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history: history ?? [] }),
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

  runAutonomousGate: async (
    caseId: string,
    opts?: {
      forceReindex?: boolean;
      maxRepairCycles?: number;
      autoCertify?: boolean;
      startWatch?: boolean;
      watchIntervalSec?: number;
    },
  ): Promise<AutonomousGateResult> => {
    try {
      return await request<AutonomousGateResult>(`/api/cases/${caseId}/gate/run`, {
        method: 'POST',
        body: JSON.stringify({
          forceReindex: opts?.forceReindex ?? false,
          maxRepairCycles: opts?.maxRepairCycles ?? 3,
          autoCertify: opts?.autoCertify ?? true,
          startWatch: opts?.startWatch ?? false,
          watchIntervalSec: opts?.watchIntervalSec ?? 180,
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('gate routes missing') && !msg.includes('Not Found')) throw err;
      const agent = await request<AutoAgentResult>(`/api/cases/${caseId}/agent/run-all`, {
        method: 'POST',
        body: JSON.stringify({
          applyRepair: true,
          startAutoLoop: false,
          forceReindex: opts?.forceReindex ?? false,
        }),
      });
      if (opts?.autoCertify && (agent.shipReady || (agent.health ?? 0) >= 80)) {
        try {
          await request(`/api/cases/${caseId}/report`, { method: 'POST' });
        } catch {
          await request(`/api/cases/${caseId}/report`);
        }
      }
      return {
        ok: agent.ok,
        health: agent.health,
        shipReady: agent.shipReady,
        log: agent.log.map((e) => ({
          t: String(Date.now()),
          phase: e.step,
          level: e.status === 'ok' ? 'ok' : e.status === 'fail' ? 'fail' : 'info',
          message: e.detail,
        })),
        pendingRepairPlan: agent.pendingRepairPlan,
      };
    }
  },

  gateStatus: async (caseId: string): Promise<AutonomousGateStatus> => {
    try {
      return await request<AutonomousGateStatus>(`/api/cases/${caseId}/gate/status`);
    } catch {
      const c = await request<CaseRecord>(`/api/cases/${caseId}`);
      return {
        caseId,
        running: false,
        phase: null,
        health: c.lastScore ?? null,
        shipReady: (c.lastScore ?? 0) >= 80,
        log: [],
      };
    }
  },

  gateWatchStart: (caseId: string, intervalSec = 180) =>
    request<AutonomousGateStatus>(`/api/cases/${caseId}/gate/watch/start`, {
      method: 'POST',
      body: JSON.stringify({ intervalSec }),
    }),

  gateWatchStop: (caseId: string) =>
    request<AutonomousGateStatus>(`/api/cases/${caseId}/gate/watch/stop`, { method: 'POST' }),

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