import { motion } from 'framer-motion';

export type VerifierStress = 'calm' | 'focused' | 'strained' | 'drowning' | 'winning';

interface GateVerifierProps {
  stress: VerifierStress;
  variant?: 'qa' | 'cognee';
  stamping?: boolean;
  size?: 'sm' | 'md';
}

const COLORS = {
  qa: { primary: '#EF5A2A', glow: 'rgba(239, 90, 42, 0.35)' },
  cognee: { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.35)' },
};

export function GateVerifier({ stress, variant = 'qa', stamping = false, size = 'md' }: GateVerifierProps) {
  const c = COLORS[variant];
  const dim = size === 'sm' ? 72 : 96;

  return (
    <div
      className={`gate-verifier variant-${variant} stress-${stress} ${stamping ? 'stamping' : ''}`}
      style={{ width: dim, height: dim }}
    >
      <motion.div
        animate={
          stress === 'winning'
            ? { scale: [1, 1.04, 1] }
            : stress === 'drowning'
              ? { rotate: [-2, 2, -2] }
              : stamping
                ? { y: [0, -3, 0] }
                : {}
        }
        className="gate-verifier-inner"
        style={{ '--gv-color': c.primary, '--gv-glow': c.glow } as React.CSSProperties}
        transition={{ duration: stress === 'drowning' ? 0.25 : 1.2, repeat: Infinity }}
      >
        <svg aria-hidden className="gate-verifier-svg" viewBox="0 0 100 110">
          <defs>
            <linearGradient id={`gv-helm-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a3344" />
              <stop offset="100%" stopColor="#141926" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="98" rx="28" ry="6" fill="rgba(0,0,0,0.35)" />
          <path d="M50 18 L78 32 V58 C78 74 66 86 50 92 C34 86 22 74 22 58 V32 Z" fill={`url(#gv-helm-${variant})`} stroke={c.primary} strokeWidth="2" />
          <path d="M50 28 L68 38 V56 C68 68 60 76 50 80 C40 76 32 68 32 56 V38 Z" fill="rgba(0,0,0,0.25)" />
          <circle cx="42" cy="52" r="4" fill={c.primary} className="gate-verifier-eye" />
          <circle cx="58" cy="52" r="4" fill={c.primary} className="gate-verifier-eye" />
          <path d="M44 64 Q50 70 56 64" fill="none" stroke={c.primary} strokeWidth="2" strokeLinecap="round" />
          <rect x="46" y="8" width="8" height="14" rx="2" fill={c.primary} opacity="0.9" />
          <motion.circle
            animate={{ opacity: [0.4, 1, 0.4] }}
            cx="50"
            cy="14"
            fill="#fff"
            r="3"
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </svg>
      </motion.div>
    </div>
  );
}