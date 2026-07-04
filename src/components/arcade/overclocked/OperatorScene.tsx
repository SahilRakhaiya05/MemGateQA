import type { ReactNode } from 'react';

interface OperatorSceneProps {
  uid: string;
  children: ReactNode;
}

function gid(uid: string, name: string) {
  return `${uid}-${name}`;
}

/** Desk, mug, steam, papers, doom ghost, crown — ported from OVERCLOCKED Kl scene rig. */
export function OperatorScene({ uid, children }: OperatorSceneProps) {
  const g = (name: string) => gid(uid, name);

  return (
    <>
      <defs>
        <radialGradient id={g('gloss')} cx="0.36" cy="0.28" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g('botShade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={g('furGrey')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9bec6" />
          <stop offset="1" stopColor="#777b83" />
        </linearGradient>
        <linearGradient id={g('furGreyDk')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a6d74" />
          <stop offset="1" stopColor="#4a4d53" />
        </linearGradient>
        <linearGradient id={g('belly')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3ddcd" />
        </linearGradient>
        <linearGradient id={g('beak')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb84d" />
          <stop offset="1" stopColor="#e07f12" />
        </linearGradient>
        <radialGradient id={g('patch')} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#2b2620" />
          <stop offset="1" stopColor="#120f0c" />
        </radialGradient>
        <filter id={g('charShadow')} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      <rect x="2" y="138" width="156" height="32" rx="4" fill="#0f141d" />
      <rect x="2" y="134" width="156" height="7" rx="3" fill="#2a3340" />
      <rect x="8" y="142" width="34" height="22" rx="2" fill="#1a2230" />
      <rect x="8" y="140" width="34" height="4" rx="2" fill="#3a4453" />
      <rect x="58" y="148" width="52" height="12" rx="2" fill="#1a2230" />
      <rect x="60" y="149" width="48" height="3" rx="1" fill="#2c3445" />

      <g className="mug">
        <rect x="120" y="130" width="16" height="18" rx="2" fill="var(--c)" />
        <path d="M136 133 q6 0 6 5 q0 5 -6 5" fill="none" stroke="var(--c)" strokeWidth="2.5" />
      </g>

      <g className="steam" stroke="#cfd6e2" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path className="st1" d="M124 124 q3 -5 0 -8 q-3 -3 0 -6" />
        <path className="st2" d="M130 124 q3 -5 0 -8 q-3 -3 0 -6" />
      </g>

      <g stroke="#39424f" strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1="142" y1="134" x2="142" y2="84" />
        <line x1="142" y1="84" x2="122" y2="64" />
      </g>
      <path d="M112 56 l22 0 l-4 14 l-14 0 z" fill="#5a6271" />
      <ellipse cx="121" cy="71" rx="3.6" ry="2.6" fill="#ffe7ad" />

      {children}

      <g className="feet-up">
        <rect x="100" y="120" width="26" height="6" rx="3" fill="#1c2430" />
        <ellipse cx="126" cy="123" rx="7" ry="4" fill="#2a3340" />
      </g>

      <g className="papers" fill="#E8DCC0" stroke="#b9a373">
        <rect className="pp1" x="40" y="96" width="26" height="18" rx="2" transform="rotate(-14 53 105)" />
        <rect className="pp2" x="74" y="98" width="28" height="20" rx="2" transform="rotate(10 88 108)" />
        <rect className="pp3" x="50" y="84" width="24" height="16" rx="2" transform="rotate(18 62 92)" />
        <rect className="pp4" x="86" y="86" width="24" height="16" rx="2" transform="rotate(-8 98 94)" />
      </g>

      <g className="help-hand">
        <rect x="116" y="92" width="9" height="20" rx="4.5" fill="var(--c)" transform="rotate(12 120 102)" />
        <circle cx="123" cy="88" r="7" className="help-wave" style={{ transformOrigin: '123px 88px' }} />
      </g>

      <g className="doom-scene">
        <path
          className="ghost"
          d="M72 70 q0 -16 8 -16 q8 0 8 16 l0 16 l-16 0 z M74 86 l-2 4 M78 86 l-2 4 M82 86 l-2 4"
          fill="rgba(207,214,226,0.85)"
          stroke="#9aa3b2"
          strokeWidth="1"
        />
        <circle cx="76" cy="60" r="1.6" fill="#5a6271" />
        <circle cx="84" cy="60" r="1.6" fill="#5a6271" />
        <path d="M75 66 q3 3 6 0 q3 3 6 0" stroke="#5a6271" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M50 150 l0 -22 q0 -8 8 -8 l24 0 q8 0 8 8 l0 22 z" fill="#4a4a52" />
        <text x="70" y="142" fontFamily="serif" fontSize="7" fill="#cfd6e2" textAnchor="middle">
          R.I.P.
        </text>
        <text x="70" y="150" fontFamily="serif" fontSize="4.5" fill="#9aa3b2" textAnchor="middle">
          THROUGHPUT
        </text>
      </g>

      <g className="spark" fill="#F5A623">
        <path className="sp1" d="M118 58 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z" />
        <path className="sp2" d="M40 56 l1.6 4.5 l4.5 1.6 l-4.5 1.6 l-1.6 4.5 l-1.6 -4.5 l-4.5 -1.6 l4.5 -1.6z" />
        <path className="sp3" d="M108 102 l1.3 3.6 l3.6 1.3 l-3.6 1.3 l-1.3 3.6 l-1.3 -3.6 l-3.6 -1.3 l3.6 -1.3z" />
      </g>

      <g className="crown" fill="#F5A623" stroke="#c47e10" strokeWidth="1">
        <path
          d="M64 56 l6 8 l4 -10 l6 12 l4 -10 l6 8 l-2 8 l-28 0 z"
          className="crown-bob"
          style={{ transformOrigin: '80px 60px' }}
        />
        <circle cx="80" cy="50" r="2" fill="#e0533f" />
      </g>
    </>
  );
}

export function useOperatorGradients(uid: string) {
  const g = (name: string) => `url(#${gid(uid, name)})`;
  return {
    gloss: g('gloss'),
    botShade: g('botShade'),
    furGrey: g('furGrey'),
    furGreyDk: g('furGreyDk'),
    belly: g('belly'),
    beak: g('beak'),
    charShadow: g('charShadow'),
  };
}