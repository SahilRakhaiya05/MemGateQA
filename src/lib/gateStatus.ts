export type GatePhase = 'pending' | 'blocked' | 'clear';

export function getGatePhase(score: number | null | undefined, hasResults = false): GatePhase {
  if (score == null || !hasResults) return 'pending';
  if (score >= 80) return 'clear';
  return 'blocked';
}

export function gatePhaseLabel(phase: GatePhase): string {
  if (phase === 'clear') return 'Ship clear';
  if (phase === 'blocked') return 'Gate blocked';
  return 'Awaiting tests';
}

export function gatePhaseScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return `${score}%`;
}