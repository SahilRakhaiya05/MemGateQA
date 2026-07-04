interface OperatorFaceProps {
  dark: string;
}

/** Shared expression layers — ported from OVERCLOCKED operator face rig. */
export function OperatorFace({ dark }: OperatorFaceProps) {
  return (
    <>
      <g className="glasses" stroke={dark} strokeWidth="1.8" fill="rgba(255,255,255,0.12)">
        <rect x="62" y="88" width="14" height="10" rx="3" />
        <rect x="84" y="88" width="14" height="10" rx="3" />
        <line x1="76" y1="92" x2="84" y2="92" />
      </g>
      <path
        className="vein"
        d="M100 80 l3 -3 l2 3 l3 -3"
        stroke="#c04030"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <g className="eyes-smug">
        <path d="M63 90 q6 4 12 0" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M85 90 q6 4 12 0" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <g className="eyes-focused">
        <circle cx="69" cy="92" r="2.6" fill={dark} />
        <circle cx="91" cy="92" r="2.6" fill={dark} />
      </g>
      <g className="eyes-stressed">
        <path d="M64 90 l4 4 M68 90 l-4 4" stroke={dark} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M88 90 l4 4 M92 90 l-4 4" stroke={dark} strokeWidth="1.8" strokeLinecap="round" />
        <circle className="eye-twitch" cx="93" cy="89" r="1.4" fill="#c04030" />
      </g>
      <g className="eyes-happy" stroke={dark} strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M63 93 q6 -6 12 0" />
        <path d="M85 93 q6 -6 12 0" />
      </g>
      <g className="eyes-x" stroke={dark} strokeWidth="2" strokeLinecap="round">
        <path d="M64 89 l6 6 M70 89 l-6 6" />
        <path d="M86 89 l6 6 M92 89 l-6 6" />
      </g>
      <g className="brow" stroke={dark} strokeWidth="2" strokeLinecap="round">
        <line x1="63" y1="84" x2="73" y2="87" />
        <line x1="97" y1="84" x2="87" y2="87" />
      </g>
      <path
        className="mouth-smug"
        d="M72 104 q8 6 16 -1 q-8 2 -16 1z"
        fill="#7a2d28"
        stroke={dark}
        strokeWidth="1.2"
      />
      <path
        className="mouth-focused"
        d="M74 104 h12"
        fill="none"
        stroke={dark}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        className="mouth-grit"
        d="M72 106 q8 -4 16 0 q-8 2 -16 0z"
        fill="#7a2d28"
        stroke={dark}
        strokeWidth="1.2"
      />
      <g className="mouth-scream">
        <ellipse cx="80" cy="106" rx="6" ry="8" fill={dark} />
        <ellipse cx="80" cy="108" rx="3" ry="4" fill="#7a2d28" />
      </g>
      <path
        className="mouth-grin"
        d="M70 100 q10 14 20 0 q-10 4 -20 0z"
        fill="#7a2d28"
        stroke={dark}
        strokeWidth="1.4"
      />
      <g className="cheeks" fill="#f3a3a3">
        <circle cx="66" cy="100" r="3" />
        <circle cx="94" cy="100" r="3" />
      </g>
      <g className="sweat" fill="#9fdcff">
        <path className="d1" d="M102 88 q5 7 0 11 q-5 -4 0 -11z" />
        <path className="d2" d="M58 90 q5 7 0 11 q-5 -4 0 -11z" />
      </g>
      <path className="tear" d="M64 96 q3 14 0 18 q-3 -4 0 -18z" fill="#9fdcff" />
    </>
  );
}