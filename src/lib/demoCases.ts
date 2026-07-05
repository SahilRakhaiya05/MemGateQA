import type { CaseRecord } from '../api/memgateqaApi';

/** Built-in demos — always seeded on bridge start */
export const PREFERRED_DEMO_IDS = ['case-data-dna', 'case-wolfpack'] as const;

export function beltStudioTitle(caseData?: Pick<CaseRecord, 'agent' | 'name'> | null): string {
  const label = caseData?.agent || caseData?.name || 'Your agent';
  return `${label} — live belt`;
}

/** @deprecated Use beltStudioTitle */
export const beltFloorTitle = beltStudioTitle;

export function sortCasesForFloor(cases: CaseRecord[]): CaseRecord[] {
  const order = new Map(PREFERRED_DEMO_IDS.map((id, i) => [id, i]));
  return [...cases].sort((a, b) => {
    const ao = order.has(a.id as (typeof PREFERRED_DEMO_IDS)[number])
      ? order.get(a.id as (typeof PREFERRED_DEMO_IDS)[number])!
      : 50;
    const bo = order.has(b.id as (typeof PREFERRED_DEMO_IDS)[number])
      ? order.get(b.id as (typeof PREFERRED_DEMO_IDS)[number])!
      : 50;
    if (ao !== bo) return ao - bo;
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
  });
}

export function defaultFloorCaseId(cases: CaseRecord[]): string {
  const sorted = sortCasesForFloor(cases);
  return sorted[0]?.id ?? PREFERRED_DEMO_IDS[0];
}