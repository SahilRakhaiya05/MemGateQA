import type { ClerkStress } from './overclocked/stress';
import { OperatorBooth } from './overclocked/OperatorBooth';
import { useCogneeBridge } from '../../hooks/useCogneeBridge';

interface CogneeLaneBoothProps {
  dataset?: string;
  indexed?: number;
  pending?: number;
  beltFast?: boolean;
  stressOverride?: ClerkStress;
}

const STRESS_LABEL: Record<ClerkStress, string> = {
  calm: 'Cognee standby',
  focused: 'remember() streaming',
  strained: 'Bridge connecting',
  drowning: 'Cognee unreachable',
  winning: 'Graph synced',
};

function getCogneeStress(
  live: boolean,
  beltFast: boolean,
  pending: number,
  indexed: number,
): ClerkStress {
  if (!live) return indexed > 0 ? 'strained' : 'drowning';
  if (beltFast) return 'focused';
  if (pending === 0 && indexed > 0) return 'winning';
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
  const stress = stressOverride ?? getCogneeStress(live, beltFast, pending, indexed);
  const ds = dataset ?? health?.dataset;

  return (
    <div className={`handler-booth cognee-lane-booth stress-${stress}`}>
      <OperatorBooth animal="penguin" laneColor="#3C7BF2" stamping={beltFast} stress={stress} uid="cognee-penguin" />
      <p className="handler-label font-hud text-[9px] uppercase tracking-wider">{STRESS_LABEL[stress]}</p>
      <p className="handler-sub text-xs text-slate-500">
        Cognee lane{ds ? ` · ${ds}` : ''}
      </p>
    </div>
  );
}