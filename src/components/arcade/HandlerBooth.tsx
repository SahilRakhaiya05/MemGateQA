import { motion } from 'framer-motion';

type Stress = 'calm' | 'focused' | 'strained' | 'drowning' | 'winning';

interface HandlerBoothProps {
  score?: number | null;
  failures?: number;
  status?: string;
}

function getStress(score: number, failures: number, status: string): Stress {
  if (score >= 80 || status === 'closed' || status === 'repaired') return 'winning';
  if (failures > 4 || score < 30) return 'drowning';
  if (failures > 1 || score < 50) return 'strained';
  if (failures > 0 || score < 80) return 'focused';
  return 'calm';
}

const STRESS_LABEL: Record<Stress, string> = {
  calm: 'Clerk on break',
  focused: 'Running interrogation',
  strained: 'Backlog building',
  drowning: 'R.I.P. THROUGHPUT',
  winning: 'Ship cleared!',
};

export function HandlerBooth({ score = 0, failures = 0, status = 'open' }: HandlerBoothProps) {
  const health = score ?? 0;
  const stress = getStress(health, failures, status);

  return (
    <div className={`handler-booth stress-${stress}`}>
      <div className="handler-booth-frame">
        <svg className="handler-svg" viewBox="0 0 120 140">
          <rect fill="#2A3340" height="30" rx="4" width="100" x="10" y="105" />
          <rect fill="#1F2734" height="8" width="80" x="20" y="100" />

          {/* Body */}
          <ellipse cx="60" cy="88" fill="#3C7BF2" rx="22" ry="18" />
          <rect fill="#3C7BF2" height="25" rx="8" width="30" x="45" y="70" />

          {/* Head */}
          <circle cx="60" cy="55" fill="#EF5A2A" r="18" />
          <circle cx="52" cy="52" fill="#fff" r="4" />
          <circle cx="68" cy="52" fill="#fff" r="4" />
          <circle cx="53" cy="53" fill="#1A1F2B" r="2" />
          <circle cx="69" cy="53" fill="#1A1F2B" r="2" />

          {/* Mouth by stress */}
          {stress === 'winning' ? (
            <path d="M52 62 Q60 70 68 62" fill="none" stroke="#1A1F2B" strokeWidth="2" />
          ) : stress === 'drowning' ? (
            <ellipse cx="60" cy="65" fill="#1A1F2B" rx="6" ry="8" />
          ) : stress === 'strained' ? (
            <line stroke="#1A1F2B" strokeWidth="2" x1="52" x2="68" y1="64" y2="64" />
          ) : (
            <path d="M54 62 Q60 58 66 62" fill="none" stroke="#1A1F2B" strokeWidth="2" />
          )}

          {/* Arms */}
          <motion.rect
            animate={stress === 'winning' ? { y: [58, 50, 58] } : stress === 'drowning' ? { y: [58, 65, 58] } : {}}
            fill="#EF5A2A"
            height="20"
            rx="4"
            transition={{ duration: 0.6, repeat: stress === 'winning' || stress === 'drowning' ? Infinity : 0 }}
            width="10"
            x="28"
            y="58"
          />
          <motion.rect
            animate={stress === 'winning' ? { y: [58, 50, 58] } : {}}
            fill="#EF5A2A"
            height="20"
            rx="4"
            transition={{ duration: 0.6, repeat: stress === 'winning' ? Infinity : 0, delay: 0.15 }}
            width="10"
            x="82"
            y="58"
          />

          {/* Crown when winning */}
          {stress === 'winning' ? (
            <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <polygon fill="#F5A623" points="48,32 52,22 56,32 60,18 64,32 68,22 72,32" />
            </motion.g>
          ) : null}

          {/* Sweat when strained */}
          {stress === 'strained' || stress === 'drowning' ? (
            <>
              <ellipse cx="42" cy="48" fill="#00f5ff" opacity="0.7" rx="2" ry="4" />
              <ellipse cx="78" cy="50" fill="#00f5ff" opacity="0.7" rx="2" ry="4" />
            </>
          ) : null}

          {/* Paper storm when drowning */}
          {stress === 'drowning'
            ? Array.from({ length: 8 }).map((_, i) => (
                <motion.rect
                  key={i}
                  animate={{ y: [20 + i * 5, 90], opacity: [1, 0.3], rotate: [0, 45] }}
                  fill="#E8DCC0"
                  height="8"
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  width="10"
                  x={20 + i * 10}
                  y={20}
                />
              ))
            : null}
        </svg>

        {stress === 'drowning' ? (
          <div className="handler-tombstone">R.I.P.<br />THROUGHPUT</div>
        ) : null}
      </div>
      <p className="handler-label font-hud text-[9px] uppercase tracking-wider">{STRESS_LABEL[stress]}</p>
      <p className="handler-sub text-xs text-slate-500">Memory clerk · lane 1</p>
    </div>
  );
}