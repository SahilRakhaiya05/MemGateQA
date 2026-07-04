import type { CaseRecord } from '../../api/memgateqaApi';

export type NextStep = {
  label: string;
  hint: string;
  path: string;
} | null;

export function computeNextStep(caseData: CaseRecord, currentPath: string): NextStep {
  const base = `/cases/${caseData.id}`;
  const dataIds = caseData.cogneeDataIds ?? {};
  const indexed = caseData.evidence.filter((e) => dataIds[e.id]).length;
  const hasEvidence = caseData.evidence.length > 0;
  const hasTests = caseData.tests.length > 0;
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;
  const hasRepair = (caseData.resultsAfter?.length ?? 0) > 0;
  const hasReport = (caseData.reports?.length ?? 0) > 0;
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const score = caseData.lastScore ?? 0;
  const shipReady = score >= 80;

  if (!hasEvidence && !currentPath.endsWith('/evidence')) {
    return { label: 'Load evidence', hint: 'Add evidence packets to the case', path: `${base}/evidence` };
  }
  if (hasEvidence && indexed < caseData.evidence.length && currentPath.endsWith('/evidence')) {
    return { label: 'INDEX into Cognee', hint: 'Press INDEX to run remember()', path: `${base}/evidence` };
  }
  if (hasEvidence && !hasTests && !currentPath.endsWith('/tests')) {
    return { label: 'Add trap tests', hint: 'Configure the interrogation suite', path: `${base}/tests` };
  }
  if (hasTests && !hasResults && !currentPath.endsWith('/tests')) {
    return { label: 'Run trap tests', hint: 'Run Gate to fire recall()', path: `${base}/tests` };
  }
  if (hasResults && failures > 0 && !hasRepair && !currentPath.endsWith('/surgery')) {
    return { label: 'Approve repair', hint: 'Run improve() + forget() surgery', path: `${base}/surgery` };
  }
  if (hasResults && !shipReady && !currentPath.endsWith('/surgery') && failures > 0) {
    return { label: 'Memory surgery', hint: 'Clear failures before ship', path: `${base}/surgery` };
  }
  if (hasResults && !hasReport && !currentPath.endsWith('/report')) {
    return { label: 'Generate proof', hint: 'Press SHIP for the certificate', path: `${base}/report` };
  }
  if (shipReady && hasReport) {
    return { label: 'Ship cleared', hint: 'Audit passed the 80% gate', path: `${base}/report` };
  }
  return null;
}