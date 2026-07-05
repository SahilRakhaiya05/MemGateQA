import type { HealthBreakdown, MemoryCase, TestRunResult } from './types';
import { healthScore, passRate } from './scoring';

export function buildCaseReport(
  memoryCase: MemoryCase,
  results: TestRunResult[],
  breakdown: HealthBreakdown,
  phase: string,
  connectedMode: boolean,
) {
  return {
    caseId: memoryCase.id,
    caseName: memoryCase.name,
    agent: memoryCase.agent,
    dataset: memoryCase.dataset,
    exportedAt: new Date().toISOString(),
    phase,
    mode: connectedMode ? 'cognee-cloud' : 'offline',
    memoryHealthScore: healthScore(breakdown),
    passRate: passRate(results),
    breakdown,
    evidence: memoryCase.evidence.map((e) => ({
      id: e.id,
      title: e.title,
      kind: e.kind,
      sensitivity: e.sensitivity,
      shouldRemember: e.shouldRemember,
      shouldForget: e.shouldForget ?? false,
    })),
    tests: memoryCase.tests.map((test) => {
      const result = results.find((r) => r.testId === test.id);
      return {
        id: test.id,
        title: test.title,
        category: test.category,
        question: test.question,
        expected: test.expected,
        actual: result?.actual ?? null,
        status: result?.status ?? 'queued',
        reason: result?.reason ?? null,
        score: result?.afterScore ?? result?.beforeScore ?? null,
        citedIds: result?.citedIds ?? null,
        references: result?.references ?? null,
        searchType: result?.searchType ?? null,
      };
    }),
    formula: {
      evidenceGrounding: '30%',
      freshness: '20%',
      contradictionConsistency: '15%',
      premiseResistance: '15%',
      privacyLeakResistance: '10%',
      forgetSuccess: '10%',
    },
  };
}

export function downloadReportJson(report: ReturnType<typeof buildCaseReport>, filename = 'memgateqa-case-report.json') {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}