export type ClerkStress = 'calm' | 'focused' | 'strained' | 'drowning' | 'winning';
export type OperatorAnimal = 'badger' | 'penguin';

export type OcStressState = {
  className: string;
  level: 0 | 1 | 2 | 3;
  winning: boolean;
};

export function clerkStressToOc(stress: ClerkStress): OcStressState {
  if (stress === 'winning') return { className: 'winning', level: 0, winning: true };
  if (stress === 'drowning') return { className: 'doom', level: 3, winning: false };
  const map: Record<Exclude<ClerkStress, 'winning' | 'drowning'>, 0 | 1 | 2> = {
    calm: 0,
    focused: 1,
    strained: 2,
  };
  const level = map[stress];
  return { className: `stress-${level}`, level, winning: false };
}