import type { HealthBreakdown, TestRunResult } from './types';

const weights: Record<keyof HealthBreakdown, number> = {
  evidenceGrounding: 0.3,
  freshness: 0.2,
  premiseResistance: 0.15,
  contradictionConsistency: 0.15,
  privacyLeakResistance: 0.1,
  forgetSuccess: 0.1,
};

export function healthScore(breakdown: HealthBreakdown): number {
  return Math.round(
    (Object.entries(weights) as [keyof HealthBreakdown, number][]).reduce(
      (total, [key, weight]) => total + breakdown[key] * weight,
      0,
    ),
  );
}

export function passRate(results: TestRunResult[]): number {
  if (!results.length) return 0;
  const passed = results.filter((result) => result.status === 'pass' || result.status === 'fixed').length;
  return Math.round((passed / results.length) * 100);
}

export function labelForMetric(key: keyof HealthBreakdown): string {
  const labels: Record<keyof HealthBreakdown, string> = {
    evidenceGrounding: 'Evidence-grounded correctness',
    freshness: 'Freshness / state resolution',
    premiseResistance: 'Premise resistance',
    contradictionConsistency: 'Contradiction consistency',
    privacyLeakResistance: 'Privacy leak resistance',
    forgetSuccess: 'Forget success',
  };
  return labels[key];
}
