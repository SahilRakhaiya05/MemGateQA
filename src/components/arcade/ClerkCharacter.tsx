import { motion } from 'framer-motion';

export type ClerkStress = 'calm' | 'focused' | 'strained' | 'drowning' | 'winning';
export type ClerkVariant = 'badger' | 'penguin';

interface ClerkCharacterProps {
  variant: ClerkVariant;
  stress: ClerkStress;
  className?: string;
}

function Mouth({ stress }: { stress: ClerkStress }) {
  if (stress === 'winning') {
    return <path d="M52 62 Q60 70 68 62" fill="none" stroke="#1A1F2B" strokeWidth="2" />;
  }
  if (stress === 'drowning') {
    return <ellipse cx="60" cy="65" fill="#1A1F2B" rx="6" ry="8" />;
  }
  if (stress === 'strained') {
    return <line stroke="#1A1F2B" strokeWidth="2" x1="52" x2="68" y1="64" y2="64" />;
  }
  return <path d="M54 62 Q60 58 66 62" fill="none" stroke="#1A1F2B" strokeWidth="2" />;
}

function BadgerBody({ stress }: { stress: ClerkStress }) {
  const armAnim =
    stress === 'winning'
      ? { y: [58, 48, 58] }
      : stress === 'drowning'
        ? { y: [58, 68, 58] }
        : stress === 'focused'
          ? { rotate: [0, -8, 0] }
          : {};

  return (
    <>
      <rect fill="#2A3340" height="30" rx="4" width="100" x="10" y="105" />
      <rect fill="#1F2734" height="8" width="80" x="20" y="100" />

      <ellipse cx="60" cy="90" fill="#5C4A3A" rx="24" ry="16" />
      <rect fill="#3C7BF2" height="28" rx="8" width="32" x="44" y="68" />
      <rect fill="#2E5FCC" height="6" rx="2" width="32" x="44" y="82" />

      <ellipse cx="60" cy="52" fill="#8B7355" rx="20" ry="18" />
      <ellipse cx="60" cy="58" fill="#F5E6D3" rx="12" ry="10" />
      <ellipse cx="48" cy="48" fill="#3D3228" rx="7" ry="5" />
      <ellipse cx="72" cy="48" fill="#3D3228" rx="7" ry="5" />
      <path d="M44 44 L52 50 L44 54 Z" fill="#2A2218" />
      <path d="M76 44 L68 50 L76 54 Z" fill="#2A2218" />

      <circle cx="52" cy="52" fill="#fff" r="4" />
      <circle cx="68" cy="52" fill="#fff" r="4" />
      <circle cx="53" cy="53" fill="#1A1F2B" r="2" />
      <circle cx="69" cy="53" fill="#1A1F2B" r="2" />
      <ellipse cx="60" cy="58" fill="#C4A882" rx="4" ry="3" />

      <Mouth stress={stress} />

      <motion.rect
        animate={armAnim}
        fill="#8B7355"
        height="22"
        rx="5"
        style={{ transformOrigin: '33px 58px' }}
        transition={{ duration: 0.55, repeat: stress === 'winning' || stress === 'drowning' || stress === 'focused' ? Infinity : 0 }}
        width="12"
        x="27"
        y="56"
      />
      <motion.rect
        animate={stress === 'winning' ? { y: [58, 48, 58] } : {}}
        fill="#8B7355"
        height="22"
        rx="5"
        transition={{ duration: 0.55, repeat: stress === 'winning' ? Infinity : 0, delay: 0.12 }}
        width="12"
        x="81"
        y="56"
      />

      {stress === 'winning' ? (
        <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity }}>
          <polygon fill="#F5A623" points="48,28 52,16 56,28 60,10 64,28 68,16 72,28" />
        </motion.g>
      ) : null}

      {(stress === 'strained' || stress === 'drowning') && (
        <>
          <ellipse cx="40" cy="46" fill="#00f5ff" opacity="0.75" rx="2" ry="4" />
          <ellipse cx="80" cy="48" fill="#00f5ff" opacity="0.75" rx="2" ry="4" />
        </>
      )}

      {stress === 'drowning'
        ? Array.from({ length: 6 }).map((_, i) => (
            <motion.rect
              key={i}
              animate={{ y: [18 + i * 4, 88], opacity: [1, 0.2], rotate: [0, 40] }}
              fill="#E8DCC0"
              height="8"
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
              width="10"
              x={22 + i * 12}
              y={18}
            />
          ))
        : null}
    </>
  );
}

function PenguinBody({ stress }: { stress: ClerkStress }) {
  const waddle = stress === 'focused' || stress === 'winning';

  return (
    <motion.g animate={waddle ? { rotate: [-2, 2, -2] } : {}} style={{ transformOrigin: '60px 90px' }} transition={{ duration: 0.4, repeat: waddle ? Infinity : 0 }}>
      <rect fill="#1A2535" height="30" rx="4" width="100" x="10" y="105" />
      <rect fill="#121A28" height="8" width="80" x="20" y="100" />

      <ellipse cx="60" cy="88" fill="#1A1F2B" rx="22" ry="20" />
      <ellipse cx="60" cy="82" fill="#F8FAFC" rx="14" ry="16" />

      <rect fill="#00D4FF" height="8" rx="3" width="36" x="42" y="74" />
      <path d="M42 78 Q60 92 78 78" fill="none" stroke="#00A8CC" strokeWidth="2" />

      <ellipse cx="60" cy="48" fill="#1A1F2B" rx="18" ry="16" />
      <ellipse cx="60" cy="50" fill="#F8FAFC" rx="11" ry="10" />
      <ellipse cx="60" cy="56" fill="#F5A623" rx="5" ry="4" />

      <circle cx="52" cy="46" fill="#fff" r="4" />
      <circle cx="68" cy="46" fill="#fff" r="4" />
      <circle cx="53" cy="47" fill="#0F172A" r="2" />
      <circle cx="69" cy="47" fill="#0F172A" r="2" />

      <Mouth stress={stress} />

      <motion.ellipse
        animate={stress === 'focused' ? { x: [56, 64, 56] } : {}}
        cx="60"
        cy="88"
        fill="#F5A623"
        rx="6"
        ry="4"
        transition={{ duration: 0.35, repeat: stress === 'focused' ? Infinity : 0 }}
      />

      <ellipse cx="38" cy="78" fill="#1A1F2B" rx="8" ry="14" />
      <ellipse cx="82" cy="78" fill="#1A1F2B" rx="8" ry="14" />

      {stress === 'winning' ? (
        <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
          <circle cx="30" cy="30" fill="none" r="4" stroke="#00f5ff" strokeWidth="1.5" />
          <circle cx="90" cy="28" fill="#00f5ff" r="3" />
          <line stroke="#00f5ff" strokeWidth="1" x1="34" x2="86" y1="30" y2="28" />
        </motion.g>
      ) : null}

      {(stress === 'calm' || stress === 'focused') && (
        <>
          <motion.circle
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
            cx="28"
            cy="36"
            fill="#00f5ff"
            r="3"
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <motion.circle
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            cx="92"
            cy="40"
            fill="#7DD3FC"
            r="2"
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
          />
        </>
      )}

      {stress === 'drowning' ? (
        <>
          <motion.line animate={{ opacity: [1, 0.3, 1] }} stroke="#64748b" strokeWidth="2" strokeDasharray="4 3" x1="20" x2="100" y1="118" y2="118" transition={{ duration: 0.5, repeat: Infinity }} />
          <text fill="#64748b" fontFamily="monospace" fontSize="8" x="38" y="126">
            NO GRAPH
          </text>
        </>
      ) : null}
    </motion.g>
  );
}

export function ClerkCharacter({ variant, stress, className = '' }: ClerkCharacterProps) {
  return (
    <svg className={`clerk-character ${variant} stress-${stress} ${className}`} viewBox="0 0 120 140">
      {variant === 'badger' ? <BadgerBody stress={stress} /> : <PenguinBody stress={stress} />}
    </svg>
  );
}