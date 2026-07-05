import { motion } from 'framer-motion';

interface FactoryHUDProps {
  score?: number | null;
  failures?: number;
  evidence?: number;
  tests?: number;
  status?: string;
  laneColor?: string;
  hasResults?: boolean;
}

export function FactoryHUD({
  score = 0,
  failures = 0,
  evidence = 0,
  tests = 0,
  status = 'open',
  laneColor = '#EF5A2A',
  hasResults = false,
}: FactoryHUDProps) {
  const health = score ?? 0;
  const jammed = failures > 3;
  const phase = score == null || !hasResults ? 'pending' : health >= 80 ? 'clear' : 'blocked';
  const needleDeg = score != null ? -180 + (health / 100) * 180 : -180;
  const needleRad = (needleDeg * Math.PI) / 180;
  const needleX = 60 + 33 * Math.cos(needleRad);
  const needleY = 65 + 33 * Math.sin(needleRad);

  return (
    <div className="oc-hud" style={{ '--lane-color': laneColor } as React.CSSProperties}>
      <div className="oc-hud-gauge-wrap">
        <div className="oc-hud-gauge-inner">
          <svg className="oc-hud-gauge" viewBox="0 0 120 76" aria-hidden>
            <path d="M15 65 A50 50 0 0 1 105 65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M15 65 A50 50 0 0 1 105 65"
              fill="none"
              stroke={phase === 'clear' ? '#22ff88' : phase === 'blocked' ? (health >= 50 ? '#F5A623' : '#e0533f') : '#64748b'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={score != null ? `${(health / 100) * 157} 157` : '0 157'}
            />
            <motion.line
              animate={{ x2: needleX, y2: needleY }}
              initial={{ x2: 60, y2: 32 }}
              stroke="rgba(255,255,255,0.9)"
              strokeLinecap="round"
              strokeWidth="2"
              transition={{ duration: 0.8, ease: 'easeOut' }}
              x1="60"
              y1="65"
            />
            <circle cx="60" cy="65" fill={laneColor} r="4.5" />
          </svg>
          <div className="oc-hud-gauge-text">
            <div className="oc-hud-gauge-value">{score != null ? `${health}%` : '—'}</div>
            <div className="oc-hud-gauge-label">Health</div>
          </div>
        </div>
      </div>

      <div className="oc-hud-meters">
        <Meter color="#00f5ff" label="Evidence" max={20} value={evidence} />
        <Meter color="#EF5A2A" label="Trap tests" max={12} value={tests} />
        <Meter color={failures > 0 ? '#e0533f' : '#22ff88'} label="Failures" max={10} value={failures} />
      </div>

      <div className="oc-hud-chips">
        <span className={`oc-hud-chip ${phase === 'clear' ? 'pass' : phase === 'blocked' ? 'warn' : ''}`}>
          {phase === 'clear' ? '✓ SHIP CLEAR' : phase === 'blocked' ? '⚠ GATE BLOCKED' : '○ AWAITING TESTS'}
        </span>
        <span className="oc-hud-chip">{status.toUpperCase()}</span>
        {jammed ? <span className="oc-hud-chip jam">+{failures} JAM</span> : null}
      </div>
    </div>
  );
}

function Meter({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="oc-hud-meter">
      <div className="oc-hud-meter-head">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="oc-hud-meter-track">
        <motion.div
          animate={{ width: `${pct}%` }}
          className="oc-hud-meter-fill"
          initial={{ width: 0 }}
          style={{ background: color }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}