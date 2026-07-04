import { motion } from 'framer-motion';

interface ScoreArcBannerProps {
  score: number;
  before?: number | null;
  label?: string;
}

export function ScoreArcBanner({ score, before, label = 'Memory Health' }: ScoreArcBannerProps) {
  const ready = score >= 80;
  const circ = 283;
  const offset = circ - (score / 100) * circ;
  const improved = before != null && before < score;

  return (
    <div className={`score-arc-banner ${ready ? 'ready' : 'blocked'}`}>
      <svg className="score-arc-ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          animate={{ strokeDashoffset: offset }}
          cx="50"
          cy="50"
          fill="none"
          initial={{ strokeDashoffset: circ }}
          r="45"
          stroke={ready ? 'var(--success)' : 'var(--warning)'}
          strokeDasharray={circ}
          strokeLinecap="round"
          strokeWidth="8"
          transform="rotate(-90 50 50)"
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="score-arc-center">
        <motion.span
          animate={{ scale: [0.9, 1] }}
          className="score-arc-value"
          initial={{ scale: 0.8 }}
        >
          {score}%
        </motion.span>
        <span className="score-arc-label">{label}</span>
      </div>
      {improved ? (
        <span className="score-arc-delta">
          <span className="score-arc-delta-before">{before}%</span>
          <span className="score-arc-delta-arrow" aria-hidden>→</span>
          <span className="score-arc-delta-after">{score}%</span>
        </span>
      ) : null}
      <span className={`score-arc-badge ${ready ? 'pass' : 'fail'}`}>
        {ready ? '✓ SHIP CLEAR' : '⚠ BLOCKED'}
      </span>
    </div>
  );
}