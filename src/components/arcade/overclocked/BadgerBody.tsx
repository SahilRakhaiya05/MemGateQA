import { OperatorFace } from './OperatorFace';
import { OperatorScene, useOperatorGradients } from './OperatorScene';

interface BadgerBodyProps {
  uid: string;
}

/** Grey badger clerk — OVERCLOCKED Py rig. */
export function BadgerBody({ uid }: BadgerBodyProps) {
  const skin = '#8a8d93';
  const dark = '#2a2620';
  const grad = useOperatorGradients(uid);

  return (
    <OperatorScene uid={uid}>
      <g className="body-g" style={{ transformOrigin: '80px 158px' }}>
        <rect x="58" y="100" width="44" height="42" rx="8" fill="#161c26" />
        <rect x="62" y="104" width="36" height="34" rx="6" fill="#1d2531" />

        <g className="torso">
          <path d="M38 170 C38 130 60 118 80 118 C100 118 122 130 122 170 Z" fill="var(--c)" filter={grad.charShadow} />
          <path d="M38 170 C38 130 60 118 80 118 C100 118 122 130 122 170 Z" fill={grad.gloss} />
          <path d="M38 170 C38 130 60 118 80 118 C100 118 122 130 122 170 Z" fill={grad.botShade} />
          <path d="M66 120 L80 140 L94 120 L89 118 L80 132 L71 118 Z" fill={grad.belly} />
          <line x1="74" y1="126" x2="72" y2="152" stroke="#1d2530" strokeWidth="1.5" opacity="0.5" />
          <rect x="67" y="150" width="11" height="9" rx="2" fill="#cfd6e2" />
          <circle cx="80" cy="150" r="1.6" fill="#1d2530" opacity="0.5" />
        </g>

        <rect x="73" y="106" width="14" height="16" rx="6" fill={skin} />

        <g className="arm-stamp" style={{ transformOrigin: '90px 132px' }}>
          <rect x="84" y="108" width="14" height="34" rx="7" fill="var(--c)" />
          <rect x="84" y="108" width="14" height="34" rx="7" fill={grad.botShade} />
          <g className="hand-stamp">
            <rect x="80" y="92" width="20" height="13" rx="3.5" fill="#454f5d" />
            <rect x="80" y="92" width="20" height="5" rx="2.5" fill="#5a6473" />
            <rect x="87" y="82" width="8" height="12" rx="2.5" fill="#2a3340" />
          </g>
        </g>

        <g className="arm-flex" style={{ transformOrigin: '94px 138px' }}>
          <path d="M94 140 C122 122 134 92 126 66" fill="none" stroke="var(--c)" strokeWidth="13" strokeLinecap="round" />
          <circle cx="125" cy="63" r="10.5" fill={skin} />
          <circle cx="125" cy="63" r="10.5" fill={grad.gloss} />
          <path d="M119 60 q6 -3 12 0" fill="none" stroke="#5c5f66" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        </g>

        <g className="head" style={{ transformOrigin: '80px 112px' }}>
          <g className="ears">
            <ellipse cx="57" cy="76" rx="8" ry="9" fill={grad.furGreyDk} />
            <ellipse cx="103" cy="76" rx="8" ry="9" fill={grad.furGreyDk} />
            <ellipse cx="57" cy="77" rx="3.4" ry="4.2" fill="#caa0a0" />
            <ellipse cx="103" cy="77" rx="3.4" ry="4.2" fill="#caa0a0" />
          </g>
          <ellipse cx="80" cy="92" rx="25" ry="24" fill={grad.furGrey} />
          <ellipse cx="80" cy="92" rx="25" ry="24" fill={grad.gloss} />
          <path d="M57 82 C57 62 103 62 103 82 C103 70 95 65 80 65 C65 65 57 70 57 82 Z" fill={grad.belly} />
          <path d="M55 92 q-5 -12 5 -19 q-3 10 0 19z" fill={dark} />
          <path d="M105 92 q5 -12 -5 -19 q3 10 0 19z" fill={dark} />
          <ellipse cx="80" cy="105" rx="12" ry="9.5" fill={grad.belly} />
          <ellipse cx="80" cy="100" rx="4" ry="3.1" fill={dark} />
          <circle cx="78.4" cy="98.8" r="1.1" fill="#fff" opacity="0.7" />
          <OperatorFace dark={dark} />
        </g>
      </g>
    </OperatorScene>
  );
}