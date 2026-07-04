import { motion } from 'framer-motion';
import type { CaseRecord } from '../../api/memgateqaApi';

interface SortationScoreboardProps {
  cases: CaseRecord[];
  featured?: CaseRecord | null;
  compact?: boolean;
}

export function SortationScoreboard({ cases, featured, compact = false }: SortationScoreboardProps) {
  const shipReady = cases.filter((c) => (c.lastScore ?? 0) >= 80).length;
  const blocked = cases.filter((c) => c.lastScore != null && (c.lastScore ?? 0) < 80).length;
  const avgHealth =
    cases.filter((c) => c.lastScore != null).length > 0
      ? Math.round(
          cases.filter((c) => c.lastScore != null).reduce((s, c) => s + (c.lastScore ?? 0), 0) /
            cases.filter((c) => c.lastScore != null).length,
        )
      : 0;
  const featuredScore = featured?.lastScore ?? 0;

  return (
    <div className={`sortation-scoreboard ${compact ? 'compact' : ''}`}>
      <div className="scoreboard-brand">
        <svg className="scoreboard-bolt" viewBox="0 0 24 32" fill="none">
          <path d="M13 0L4 18h7l-1 14 12-20h-8l1-12z" fill="url(#boltGrad)" stroke="#F5A623" strokeWidth="0.5" />
          <defs>
            <linearGradient id="boltGrad" x1="4" y1="0" x2="20" y2="32">
              <stop stopColor="#EF5A2A" />
              <stop offset="1" stopColor="#F5A623" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <span className="scoreboard-title">MEMGATE QA ARENA</span>
          <span className="scoreboard-sub">Sortation · Memory Health Gate</span>
        </div>
      </div>

      <div className="scoreboard-lanes">
        <LaneChip color="#EF5A2A" label="Lane 1" score={featuredScore} sub={featured?.name ?? 'No active case'} />
        <LaneChip color="#3C7BF2" label="Fleet avg" score={avgHealth} sub={`${cases.length} audits`} />
        <LaneChip color="#46C46E" label="Ship clear" score={shipReady} sub="cases ≥80%" isCount />
        <LaneChip color="#e0533f" label="Blocked" score={blocked} sub="needs repair" isCount />
      </div>

      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        className="scoreboard-timer"
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="scoreboard-timer-dot" />
        LIVE AUDIT
      </motion.div>
    </div>
  );
}

function LaneChip({
  label,
  score,
  sub,
  color,
  isCount,
}: {
  label: string;
  score: number;
  sub: string;
  color: string;
  isCount?: boolean;
}) {
  return (
    <div className="scoreboard-lane" style={{ '--lane': color } as React.CSSProperties}>
      <span className="scoreboard-lane-label">{label}</span>
      <span className="scoreboard-lane-score">{isCount ? score : `${score}%`}</span>
      <span className="scoreboard-lane-sub">{sub}</span>
    </div>
  );
}