import { GateVerifier, type VerifierStress } from '../GateVerifier';

type Stress = VerifierStress;

interface HandlerBoothProps {
  score?: number | null;
  failures?: number;
  status?: string;
  stressOverride?: Stress;
  agent?: string;
  stamping?: boolean;
}

function getStress(score: number, failures: number, status: string): Stress {
  if (score >= 80 || status === 'closed' || status === 'repaired') return 'winning';
  if (failures > 4 || score < 30) return 'drowning';
  if (failures > 1 || score < 50) return 'strained';
  if (failures > 0 || score < 80) return 'focused';
  return 'calm';
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
}: HandlerBoothProps) {
  const health = score ?? 0;
  const stress = stressOverride ?? getStress(health, failures, status);

  return (
    <div className={`handler-booth qa-lane-booth stress-${stress}`}>
      <GateVerifier size="sm" stamping={stamping} stress={stress} variant="qa" />
      <p className="handler-label font-hud text-[9px] uppercase tracking-wider">{STRESS_LABEL[stress]}</p>
      <p className="handler-sub text-xs text-slate-500">{agent ? `${agent} · QA lane` : 'Trap verifier · QA lane'}</p>
    </div>
  );
}