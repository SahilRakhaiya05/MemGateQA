import type { CaseRecord, TestResult } from '../api/memgateqaApi';

export type LintSeverity = 'hard' | 'soft' | 'temporal';

export interface LintFinding {
  id: string;
  severity: LintSeverity;
  category: string;
  title: string;
  detail: string;
  testId?: string;
  repairHint: string;
}

const SEVERITY_BY_CATEGORY: Record<string, LintSeverity> = {
  contradiction: 'hard',
  privacy: 'hard',
  stale: 'temporal',
  forget: 'temporal',
  unsupported: 'soft',
  premise: 'soft',
  hallucination: 'soft',
};

const REPAIR_HINTS: Record<string, string> = {
  stale: 'Run improve() with the latest architecture decision; forget superseded evidence.',
  contradiction: 'Pin authoritative evidence via remember(); improve() to resolve conflicting nodes.',
  unsupported: 'Ground recall with cited evidence IDs; reject answers without graph support.',
  privacy: 'forget() private datasets; add recall guardrails for secret sensitivity.',
  forget: 'forget() targeted data_ids; rerun negative recall traps.',
  premise: 'Add premise-resistance instruction via improve(); reject false premises in recall.',
};

export function severityForCategory(category: string): LintSeverity {
  return SEVERITY_BY_CATEGORY[category] ?? 'soft';
}

export function buildLintFindings(caseData: CaseRecord, results: TestResult[]): LintFinding[] {
  const findings: LintFinding[] = [];
  const failed = results.filter((r) => r.status === 'fail');

  for (const result of failed) {
    const test = caseData.tests.find((t) => t.id === result.testId);
    const category = test?.category ?? 'unsupported';
    findings.push({
      id: `lint-${result.testId}`,
      severity: severityForCategory(category),
      category,
      title: test?.title ?? result.testId,
      detail: result.reason || result.actual?.slice(0, 200) || 'Trap test failed',
      testId: result.testId,
      repairHint: REPAIR_HINTS[category] ?? 'Review recall output and apply approved memory surgery.',
    });
  }

  const forgetEvidence = caseData.evidence.filter((e) => e.shouldForget);
  if (forgetEvidence.length && failed.some((r) => caseData.tests.find((t) => t.id === r.testId)?.category === 'forget')) {
    findings.push({
      id: 'lint-forget-corpus',
      severity: 'temporal',
      category: 'forget',
      title: 'Forget corpus pending purge',
      detail: `${forgetEvidence.length} evidence items flagged shouldForget — still retrievable after recall.`,
      repairHint: 'forget() all flagged data_ids, then rerun forget traps.',
    });
  }

  const privateEvidence = caseData.evidence.filter(
    (e) => e.sensitivity === 'private' || e.sensitivity === 'secret',
  );
  if (privateEvidence.length && failed.some((r) => caseData.tests.find((t) => t.id === r.testId)?.category === 'privacy')) {
    findings.push({
      id: 'lint-privacy-corpus',
      severity: 'hard',
      category: 'privacy',
      title: 'Private evidence in graph',
      detail: `${privateEvidence.length} private/secret items may leak through unscoped recall.`,
      repairHint: 'Isolate private nodes; forget or scope recall with node_set filters.',
    });
  }

  const stalePairs = caseData.evidence.filter((e) => /old|supabase|5 pm/i.test(e.body));
  const freshPairs = caseData.evidence.filter((e) => /final|next\.js|2 pm|rejected/i.test(e.body));
  if (stalePairs.length && freshPairs.length && failed.some((r) => caseData.tests.find((t) => t.id === r.testId)?.category === 'stale')) {
    findings.push({
      id: 'lint-temporal-supersede',
      severity: 'temporal',
      category: 'stale',
      title: 'Superseded decision still indexed',
      detail: 'Older and newer architecture notes coexist — recall may surface stale facts.',
      repairHint: 'forget() superseded evidence; remember() canonical decision as single source of truth.',
    });
  }

  return findings;
}

export function lintSummary(findings: LintFinding[]) {
  return {
    total: findings.length,
    hard: findings.filter((f) => f.severity === 'hard').length,
    soft: findings.filter((f) => f.severity === 'soft').length,
    temporal: findings.filter((f) => f.severity === 'temporal').length,
    shipBlocked: findings.some((f) => f.severity === 'hard'),
  };
}

export function buildGapFillSuggestions(caseData: CaseRecord, failures: TestResult[]): string[] {
  const suggestions = new Set<string>();
  for (const f of failures) {
    const test = caseData.tests.find((t) => t.id === f.testId);
    const cat = test?.category ?? '';
    if (REPAIR_HINTS[cat]) suggestions.add(REPAIR_HINTS[cat]);
    if (test?.expected) {
      suggestions.add(`Target answer for "${test.title}": ${test.expected.slice(0, 120)}`);
    }
  }
  if (caseData.evidence.some((e) => e.shouldForget)) {
    suggestions.add('forget() all evidence marked shouldForget before rerunning traps.');
  }
  const canonical = caseData.evidence.find((e) => /final architecture|final stack/i.test(e.title));
  if (canonical) {
    suggestions.add(`remember() canonical decision: "${canonical.title}" as authoritative source.`);
  }
  return [...suggestions].slice(0, 6);
}