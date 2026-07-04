import { GateVerifier, type VerifierStress } from '../GateVerifier';
import { useCogneeBridge } from '../../hooks/useCogneeBridge';

interface CogneeLaneBoothProps {
  dataset?: string;
  indexed?: number;
  pending?: number;
  beltFast?: boolean;
  stressOverride?: VerifierStress;
}

const STRESS_LABEL: Record<VerifierStress, string> = {
  calm: 'Cognee standby',
  focused: 'remember() streaming',
  strained: 'Mock bridge mode',
  drowning: 'Cognee unreachable',
  winning: 'Graph synced',
};

function getCogneeStress(
  live: boolean,
  mock: boolean,
  beltFast: boolean,
  pending: number,
  indexed: number,
): VerifierStress {
  if (!live && !mock) return 'drowning';
  if (beltFast) return 'focused';
  if (pending === 0 && indexed > 0) return 'winning';
  if (!live && mock) return 'strained';
  return 'calm';
}

export function CogneeLaneBooth({
  dataset,
  indexed = 0,
  pending = 0,
  beltFast = false,
  stressOverride,
}: CogneeLaneBoothProps) {
  const { health } = useCogneeBridge();
  const live = Boolean(health?.cognee_reachable);
  const mock = health?.mode === 'mock';
  const stress = stressOverride ?? getCogneeStress(live, mock, beltFast, pending, indexed);
  const ds = dataset ?? health?.dataset;

  return (
    <div className={`handler-booth cognee-lane-booth stress-${stress}`}>
      <GateVerifier size="sm" stamping={beltFast} stress={stress} variant="cognee" />
      <p className="handler-label font-hud text-[9px] uppercase tracking-wider">{STRESS_LABEL[stress]}</p>
      <p className="handler-sub text-xs text-slate-500">
        Cognee lane{ds ? ` · ${ds}` : ''}
      </p>
    </div>
  );
}