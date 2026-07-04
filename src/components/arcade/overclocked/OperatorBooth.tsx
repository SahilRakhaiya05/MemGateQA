import type { CSSProperties } from 'react';
import { OperatorAnimalBody } from './OperatorAnimal';
import { clerkStressToOc, type ClerkStress, type OperatorAnimal } from './stress';

interface OperatorBoothProps {
  animal: OperatorAnimal;
  stress: ClerkStress;
  laneColor?: string;
  uid?: string;
  stamping?: boolean;
}

const LANE_COLORS: Record<OperatorAnimal, string> = {
  badger: '#EF5A2A',
  penguin: '#3C7BF2',
};

/** OVERCLOCKED operator booth — lamp glow, stress rig, desk clerk SVG. */
export function OperatorBooth({
  animal,
  stress,
  laneColor,
  uid = animal,
  stamping = false,
}: OperatorBoothProps) {
  const oc = clerkStressToOc(stress);
  const color = laneColor ?? LANE_COLORS[animal];

  return (
    <div className="oc-booth">
      <div
        className="oc-lamp-glow"
        style={{
          background: 'radial-gradient(closest-side, rgba(255,221,150,0.28), rgba(255,221,150,0) 72%)',
        }}
      />
      <div
        className={`op ${oc.className} ${stamping ? 'stamping' : ''}`}
        data-animal={animal}
        style={{ '--c': color } as CSSProperties}
      >
        <svg viewBox="0 0 160 170" className="oc-booth-svg" aria-hidden>
          <OperatorAnimalBody animal={animal} uid={uid} />
        </svg>
      </div>
    </div>
  );
}