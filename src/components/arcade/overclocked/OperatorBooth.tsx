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
    <div className="oc-booth relative h-[166px]">
      <div
        className="oc-lamp-glow absolute left-1/2 top-2 h-[166px] w-[166px] -translate-x-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(closest-side, rgba(255,221,150,0.3), rgba(255,221,150,0) 70%)',
        }}
      />
      <div
        className={`op absolute bottom-0 left-1/2 h-[166px] w-[156px] -translate-x-1/2 ${oc.className} ${stamping ? 'stamping' : ''}`}
        data-animal={animal}
        style={{ '--c': color } as CSSProperties}
      >
        <svg viewBox="0 0 160 170" width="156" height="166" className="block overflow-visible" aria-hidden>
          <OperatorAnimalBody animal={animal} uid={uid} />
        </svg>
      </div>
    </div>
  );
}