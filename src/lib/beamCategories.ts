/** BEAM benchmark display labels — internal category keys unchanged for grading. */
export const BEAM_CATEGORY_LABELS: Record<string, string> = {
  stale: 'Knowledge Update',
  contradiction: 'Temporal Reasoning',
  unsupported: 'Abstention',
  premise: 'Contradiction Resolution',
  privacy: 'Private Token Leak',
  forget: 'Forget Verification',
  decoy: 'Decoy (not scored)',
};

export const BEAM_EXTENSION_NOTE =
  'Privacy-leak and forget-verification extend BEAM — no equivalent in the standard benchmark.';

export function beamLabel(category: string): string {
  return BEAM_CATEGORY_LABELS[category] ?? category;
}

export function usesTemporalRecall(category: string): boolean {
  return category === 'stale' || category === 'contradiction';
}