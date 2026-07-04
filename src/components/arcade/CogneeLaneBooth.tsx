import { ClerkCharacter, type ClerkStress } from './ClerkCharacter';
import { useCogneeBridge } from '../../hooks/useCogneeBridge';

interface CogneeLaneBoothProps {
  dataset?: string;
  indexed?: number;
  pending?: number;
  beltFast?: boolean;
  stressOverride?: ClerkStress;
}

const STRESS_LABEL: Record<ClerkStress, string> = {
  calm: 'Graph clerk idle',
  focused: 'remember() streaming',
  strained: 'Mock bridge lane',
  drowning: 'Cognee unreachable',
  winning: 'Graph fully synced',
};

function getCogneeStress(
  live: boolean,
  mock: boolean,
  beltFast: boolean,
  pending: number,
  indexed: number,
): ClerkStress {
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
  const stress =
    stressOverride ?? getCogneeStress(live, mock, beltFast, pending, indexed);
  const ds = dataset ?? health?.dataset;

  return (
    <div className={`handler-booth cognee-lane-booth stress-${stress}`}>
      <div className="handler-booth-frame">
        <ClerkCharacter stress={stress} variant="penguin" />
        {stress === 'drowning' ? (
          <div className="handler-tombstone cognee-tombstone">
            R.I.P.
            <br />
            GRAPH
          </div>
        ) : null}
      </div>
      <p className="handler-label font-hud text-[9px] uppercase tracking-wider">{STRESS_LABEL[stress]}</p>
      <p className="handler-sub text-xs text-slate-500">
        Cognee clerk · lane 2{ds ? ` · ${ds}` : ''}
      </p>
    </div>
  );
}