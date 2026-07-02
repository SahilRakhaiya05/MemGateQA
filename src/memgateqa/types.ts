export type EvidenceKind = 'meeting' | 'decision' | 'trace' | 'private' | 'forget-request' | 'policy' | 'feedback';
export type TestCategory = 'stale' | 'contradiction' | 'unsupported' | 'privacy' | 'forget' | 'premise';
export type TestStatus = 'queued' | 'running' | 'pass' | 'fail' | 'fixed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type PipelineStageId = 'raw' | 'cleaned' | 'remembered' | 'interrogated' | 'graded' | 'repaired';

export interface EvidenceDocument {
  id: string;
  title: string;
  kind: EvidenceKind;
  date: string;
  source: string;
  body: string;
  sensitivity: 'public' | 'internal' | 'private' | 'secret';
  shouldRemember: boolean;
  shouldForget?: boolean;
  risk: string;
}

export interface MemoryTest {
  id: string;
  title: string;
  category: TestCategory;
  question: string;
  expected: string;
  trap?: string;
  severity: Severity;
  evidenceIds: string[];
  repairAction: 'remember' | 'improve' | 'forget' | 'human-review';
  weight: number;
}

export interface RecallEvidence {
  sourceId: string;
  quote: string;
  confidence: number;
}

export interface TestRunResult {
  testId: string;
  status: Exclude<TestStatus, 'queued' | 'running'>;
  actual: string;
  reason: string;
  evidence: RecallEvidence[];
  beforeScore: number;
  afterScore?: number;
}

export interface MemoryCase {
  id: string;
  name: string;
  agent: string;
  dataset: string;
  description: string;
  whyItMatters: string;
  evidence: EvidenceDocument[];
  tests: MemoryTest[];
}

export interface HealthBreakdown {
  evidenceGrounding: number;
  freshness: number;
  premiseResistance: number;
  contradictionConsistency: number;
  privacyLeakResistance: number;
  forgetSuccess: number;
}

export interface CogneeOperation {
  id: 'remember' | 'recall' | 'improve' | 'forget';
  label: string;
  command: string;
  detail: string;
  status: 'ready' | 'mocked' | 'connected' | 'needs-backend';
}

export interface SurgeryAction {
  id: string;
  operation: 'remember' | 'improve' | 'forget' | 'human-review';
  title: string;
  target: string;
  reason: string;
  expectedImpact: string;
  approvedByHuman: boolean;
}
