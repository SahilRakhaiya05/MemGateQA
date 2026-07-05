import type { CaseRecord } from '../../api/memgateqaApi';

export type CaseGuideTone = 'clear' | 'warn' | 'action' | 'info';

export interface CaseGuide {
  step: number;
  totalSteps: number;
  phase: string;
  headline: string;
  detail: string;
  actionLabel: string;
  actionPath: string;
  tone: CaseGuideTone;
}

export function computeCaseGuide(caseData: CaseRecord, currentPath: string): CaseGuide {
  const base = `/cases/${caseData.id}`;
  const dataIds = caseData.cogneeDataIds ?? {};
  const indexed = caseData.evidence.filter((e) => dataIds[e.id]).length;
  const evidenceTotal = caseData.evidence.length;
  const testCount = caseData.tests.length;
  const hasResults = (caseData.resultsBefore?.length ?? 0) > 0;
  const failures = (caseData.resultsBefore ?? []).filter((r) => r.status === 'fail').length;
  const score = caseData.lastScore ?? 0;
  const shipReady = score >= 80;
  const hasRepair = (caseData.resultsAfter?.length ?? 0) > 0;
  const hasReport = (caseData.reports?.length ?? 0) > 0;

  if (shipReady) {
    return {
      step: 6,
      totalSteps: 6,
      phase: 'Ship clear',
      headline: `${score}% — memory audit passed`,
      detail: hasReport
        ? 'Certificate is ready. Publish or share when you want others to try this agent.'
        : 'Generate the health certificate on the Proof tab.',
      actionLabel: hasReport ? 'View proof' : 'Generate proof',
      actionPath: `${base}/report`,
      tone: 'clear',
    };
  }

  if (!evidenceTotal) {
    return {
      step: 1,
      totalSteps: 6,
      phase: 'Evidence',
      headline: 'Add evidence packets',
      detail: 'Load docs, policies, and source files into this case before anything else.',
      actionLabel: 'Open evidence',
      actionPath: `${base}/evidence`,
      tone: 'action',
    };
  }

  if (indexed < evidenceTotal) {
    return {
      step: 1,
      totalSteps: 6,
      phase: 'Index',
      headline: `${indexed} of ${evidenceTotal} packets indexed`,
      detail: 'Index evidence into Cognee — or hit Run audit on the belt to remember all packets.',
      actionLabel: 'Index evidence',
      actionPath: `${base}/evidence`,
      tone: 'warn',
    };
  }

  if (!testCount) {
    return {
      step: 2,
      totalSteps: 6,
      phase: 'Traps',
      headline: 'Add recall trap tests',
      detail: 'Define questions the agent must answer correctly before deploy.',
      actionLabel: 'Open tests',
      actionPath: `${base}/tests`,
      tone: 'action',
    };
  }

  if (!hasResults) {
    return {
      step: 3,
      totalSteps: 6,
      phase: 'Audit',
      headline: 'Run the memory audit',
      detail: `${testCount} traps are ready. Hit Run audit on the belt — it indexes, recalls, and grades.`,
      actionLabel: 'Run audit on belt',
      actionPath: base,
      tone: 'action',
    };
  }

  if (failures > 0 && !hasRepair) {
    return {
      step: 4,
      totalSteps: 6,
      phase: 'Failures',
      headline: `${failures} trap${failures === 1 ? '' : 's'} failing`,
      detail: 'Open Results to see which recalls broke, then go to Repair to fix memory.',
      actionLabel: 'Review results',
      actionPath: `${base}/results`,
      tone: 'warn',
    };
  }

  if (failures > 0) {
    return {
      step: 4,
      totalSteps: 6,
      phase: 'Repair',
      headline: 'Finish memory surgery',
      detail: 'Apply improve() and forget(), then run the belt again until traps pass.',
      actionLabel: 'Open repair',
      actionPath: `${base}/surgery`,
      tone: 'warn',
    };
  }

  if (!hasReport && !currentPath.endsWith('/report')) {
    return {
      step: 5,
      totalSteps: 6,
      phase: 'Proof',
      headline: `Score ${score}% — generate proof`,
      detail: 'Traps are clear. Generate the memory health certificate for deploy.',
      actionLabel: 'Generate proof',
      actionPath: `${base}/report`,
      tone: 'info',
    };
  }

  return {
    step: 5,
    totalSteps: 6,
    phase: 'Audit',
    headline: `Score ${score}% — rerun if needed`,
    detail: 'Run the belt again or explore Graph and Chat while you wait for ship clear.',
    actionLabel: 'Open graph',
    actionPath: `${base}/graph`,
    tone: 'info',
  };
}

/** @deprecated Use computeCaseGuide */
export type NextStep = { label: string; hint: string; path: string } | null;

/** @deprecated Use computeCaseGuide */
export function computeNextStep(caseData: CaseRecord, currentPath: string): NextStep {
  const g = computeCaseGuide(caseData, currentPath);
  return { label: g.actionLabel, hint: g.detail, path: g.actionPath };
}