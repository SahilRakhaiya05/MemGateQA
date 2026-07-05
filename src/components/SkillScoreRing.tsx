interface SkillScoreRingProps {
  score: number | null | undefined;
  label?: string;
  size?: number;
}

/** Cognost/Moss-style skill score — MemGateQA memory health ring. */
export function SkillScoreRing({ score, label = 'Health', size = 56 }: SkillScoreRingProps) {
  const value = score ?? 0;
  const hasScore = score != null;
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="skill-score-ring" style={{ width: size, height: size }}>
      <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        {hasScore ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            fill="none"
            r={r}
            stroke={color}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="5"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </svg>
      <div className="skill-score-ring-label">
        <strong>{hasScore ? `${Math.round(pct)}%` : '—'}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}