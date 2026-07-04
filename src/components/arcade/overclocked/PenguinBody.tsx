import { OperatorFace } from './OperatorFace';
import { OperatorScene, useOperatorGradients } from './OperatorScene';

interface PenguinBodyProps {
  uid: string;
}

/** Penguin graph clerk — OVERCLOCKED Iy rig. */
export function PenguinBody({ uid }: PenguinBodyProps) {
  const dark = '#1a1410';
  const grad = useOperatorGradients(uid);

  return (
    <OperatorScene uid={uid}>
      <g className="body-g" style={{ transformOrigin: '80px 158px' }}>
        <rect x="58" y="100" width="44" height="42" rx="8" fill="#161c26" />
        <ellipse cx="69" cy="168" rx="10" ry="4.5" fill={grad.beak} />
        <ellipse cx="91" cy="168" rx="10" ry="4.5" fill={grad.beak} />

        <g className="torso">
          <ellipse cx="80" cy="146" rx="38" ry="28" fill="var(--c)" filter={grad.charShadow} />
          <ellipse cx="80" cy="146" rx="38" ry="28" fill={grad.gloss} />
          <ellipse cx="80" cy="146" rx="38" ry="28" fill={grad.botShade} />
          <ellipse cx="80" cy="149" rx="23" ry="21" fill={grad.belly} />
          <path d="M72 129 l-7 -4 v8 l7 -4 l8 4 v-8z" fill={dark} />
          <circle cx="80" cy="129" r="2" fill="#3a342c" />
        </g>

        <rect x="73" y="104" width="14" height="16" rx="6" fill="var(--c)" />

        <g className="arm-stamp" style={{ transformOrigin: '90px 132px' }}>
          <ellipse cx="101" cy="124" rx="7.5" ry="19" fill="var(--c)" transform="rotate(8 101 124)" />
          <ellipse cx="101" cy="124" rx="7.5" ry="19" fill={grad.botShade} transform="rotate(8 101 124)" />
          <g className="hand-stamp">
            <rect x="80" y="92" width="20" height="13" rx="3.5" fill="#454f5d" />
            <rect x="80" y="92" width="20" height="5" rx="2.5" fill="#5a6473" />
            <rect x="87" y="82" width="8" height="12" rx="2.5" fill="#2a3340" />
          </g>
        </g>

        <g className="arm-flex" style={{ transformOrigin: '94px 138px' }}>
          <path d="M94 140 C122 122 134 92 126 68" fill="none" stroke="var(--c)" strokeWidth="13" strokeLinecap="round" />
          <ellipse cx="126" cy="65" rx="8.5" ry="11" fill="var(--c)" transform="rotate(-20 126 65)" />
          <ellipse cx="126" cy="65" rx="8.5" ry="11" fill={grad.gloss} transform="rotate(-20 126 65)" />
        </g>

        <g className="head" style={{ transformOrigin: '80px 112px' }}>
          <ellipse cx="80" cy="90" rx="24" ry="26" fill="var(--c)" />
          <ellipse cx="80" cy="90" rx="24" ry="26" fill={grad.gloss} />
          <ellipse cx="80" cy="96" rx="16" ry="19" fill={grad.belly} />
          <path d="M72 103 q8 -6 16 0 q-8 9 -16 0z" fill={grad.beak} stroke="#b8740f" strokeWidth="0.8" />
          <line x1="72" y1="103" x2="88" y2="103" stroke="#b8740f" strokeWidth="0.8" />
          <OperatorFace dark={dark} />
          <g className="cheeks" fill="#ffb380" opacity="0.7">
            <circle cx="66" cy="99" r="2.6" />
            <circle cx="94" cy="99" r="2.6" />
          </g>
        </g>
      </g>
    </OperatorScene>
  );
}