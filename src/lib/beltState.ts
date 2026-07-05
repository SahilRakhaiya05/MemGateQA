export type BeltMode = 'standby' | 'preview' | 'indexing' | 'auditing';

export function deriveBeltMode(
  gateRunning: boolean,
  gatePhase: string | null | undefined,
  previewActive: boolean,
): BeltMode {
  if (gateRunning) {
    if (gatePhase === 'index' || gatePhase === 'repair') return 'indexing';
    return 'auditing';
  }
  if (previewActive) return 'preview';
  return 'standby';
}

export function beltVisuals(mode: BeltMode): {
  running: boolean;
  fast: boolean;
  slow: boolean;
  label: string;
} {
  switch (mode) {
    case 'indexing':
      return { running: true, fast: true, slow: false, label: 'Indexing memory…' };
    case 'auditing':
      return { running: true, fast: false, slow: false, label: 'Running audit…' };
    case 'preview':
      return { running: true, fast: false, slow: true, label: 'Reading agent memory…' };
    default:
      return { running: false, fast: false, slow: false, label: 'Standby — press Run audit' };
  }
}