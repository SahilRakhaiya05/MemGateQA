import type { ClerkStress } from '../components/arcade/overclocked/stress';

export const GATE_PHASES = [
  { id: 'observe', icon: '👁', label: 'Observe' },
  { id: 'index', icon: '📥', label: 'Index' },
  { id: 'interrogate', icon: '🔍', label: 'Traps' },
  { id: 'diagnose', icon: '🧠', label: 'Diagnose' },
  { id: 'repair', icon: '✨', label: 'Repair' },
  { id: 'verify', icon: '♻️', label: 'Verify' },
  { id: 'certify', icon: '📋', label: 'Certify' },
] as const;

export const GATE_PHASE_LABELS: Record<string, string> = {
  observe: 'Observing memory state…',
  index: 'remember() — indexing evidence',
  interrogate: 'recall() — running trap suite',
  diagnose: 'AI diagnosing failures',
  repair: 'improve() + forget() repair',
  verify: 'Regression verify — recall()',
  certify: 'Issuing memory certificate',
};

export function gatePhaseLabel(phase: string | null | undefined, running: boolean): string {
  if (!running || !phase) return 'Standby — press GO';
  return GATE_PHASE_LABELS[phase] ?? phase;
}

export function gatePhaseToBeltFast(phase: string | null | undefined, running: boolean): boolean {
  if (!running || !phase) return false;
  return phase === 'index' || phase === 'repair';
}

export function gatePhaseToLifecycle(phase: string | null | undefined, running: boolean): string[] {
  if (!running || !phase) return [];
  switch (phase) {
    case 'index':
      return ['remember'];
    case 'interrogate':
    case 'verify':
      return ['recall'];
    case 'repair':
      return ['improve', 'forget'];
    case 'certify':
      return ['recall'];
    default:
      return [];
  }
}

export function gatePhaseToLastOp(phase: string | null | undefined, running: boolean): string | undefined {
  if (!running || !phase) return undefined;
  if (phase === 'index') return 'remember';
  if (phase === 'interrogate' || phase === 'verify' || phase === 'certify') return 'recall';
  if (phase === 'repair') return 'improve';
  return undefined;
}

export function gatePhaseToQaStress(
  phase: string | null | undefined,
  running: boolean,
  failures: number,
  score: number | null | undefined,
  shipReady: boolean,
): ClerkStress {
  if (shipReady && !running) return 'winning';
  if (!running) {
    if (failures > 3 || (score != null && score < 35)) return 'drowning';
    if (failures > 0 || (score != null && score < 80)) return 'strained';
    return score != null ? 'focused' : 'calm';
  }
  switch (phase) {
    case 'interrogate':
    case 'verify':
      return failures > 0 ? 'strained' : 'focused';
    case 'diagnose':
      return 'strained';
    case 'certify':
      return shipReady ? 'winning' : 'strained';
    case 'repair':
      return 'drowning';
    default:
      return 'focused';
  }
}

export function gatePhaseToCogneeStress(
  phase: string | null | undefined,
  running: boolean,
  live: boolean,
  pending: number,
  indexed: number,
  shipReady: boolean,
): ClerkStress {
  if (!live) return running ? 'drowning' : indexed > 0 ? 'strained' : 'drowning';
  if (shipReady && !running && indexed > 0) return 'winning';
  if (!running) {
    if (pending === 0 && indexed > 0) return 'winning';
    return 'calm';
  }
  if (phase === 'index' || phase === 'repair') return 'focused';
  if (phase === 'certify') return shipReady ? 'winning' : 'strained';
  return 'calm';
}

export function gatePhaseIndex(phase: string | null | undefined): number {
  if (!phase) return -1;
  return GATE_PHASES.findIndex((p) => p.id === phase);
}