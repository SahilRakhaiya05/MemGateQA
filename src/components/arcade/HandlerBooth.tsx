import { GateVerifier, type VerifierStress } from '../GateVerifier';

type Stress = VerifierStress;

interface HandlerBoothProps {
  score?: number | null;
  failures?: number;
  status?: string;
  stressOverride?: Stress;
  agent?: string;
  stamping?: boolean;
  hasResults?: boolean;
}

function getStress(score: number | null | undefined, failures: number, status: string, hasResults: boolean): Stress {
  if (!hasResults && score == null) return 'calm';
  if ((score ?? 0) >= 80 || status === 'closed' || status === 'repaired') return 'winning';
  if (failures > 3 || (score != null && score < 35)) return 'drowning';
  if (failures > 0 || (score != null && score < 80)) return 'strained';
  return 'focused';
}

const STRESS_LABEL: Record<Stress, string> = {
  calm: 'Verifier standby',
  focused: 'Running traps',
  strained: 'Backlog building',
  drowning: 'Gate blocked',
  winning: 'Ship cleared',
};

export function HandlerBooth({
  score = 0,
  failures = 0,
  status = 'open',
  stressOverride,
  agent,
  stamping = false,
  hasResults = false,
}: HandlerBoothProps) {
  const stress = stressOverride ?? getStress(score, failures, status, hasResults);

  return (
    <div className={`handler-booth qa-lane-booth stress-${stress}`}>
      <GateVerifier size="sm" stamping={stamping} stress={stress} variant="qa" />
      <p className="handler-label font-hud text-[9px] uppercase tracking-wider">{STRESS_LABEL[stress]}</p>
      <p className="handler-sub text-xs text-slate-500">{agent ? `${agent} · QA lane` : 'Trap verifier · QA lane'}</p>
    </div>
  );
}