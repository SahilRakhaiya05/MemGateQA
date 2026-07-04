import { motion } from 'framer-motion';

interface FactoryHUDProps {
  score?: number | null;
  failures?: number;
  evidence?: number;
  tests?: number;
  status?: string;
  laneColor?: string;
}

export function FactoryHUD({
  score = 0,
  failures = 0,
  evidence = 0,
  tests = 0,
  status = 'open',
  laneColor = '#EF5A2A',
}: FactoryHUDProps) {
  const health = score ?? 0;
  const needleAngle = -90 + (health / 100) * 180;
  const jammed = failures > 3;
  const shipReady = health >= 80;

  return (
    <div className="oc-hud" style={{ '--lane-color': laneColor } as React.CSSProperties}>
      <div className="oc-hud-gauge-wrap">
        <svg className="oc-hud-gauge" viewBox="0 0 120 70">
          <path d="M15 65 A50 50 0 0 1 105 65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M15 65 A50 50 0 0 1 105 65"
            fill="none"
            stroke={shipReady ? '#22ff88' : health >= 50 ? '#F5A623' : '#e0533f'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(health / 100) * 157} 157`}
          />
          <motion.line
            animate={{ rotate: needleAngle }}
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transformOrigin: '60px 65px' }}
            x1="60"
            x2="60"
            y1="65"
            y2="22"
          />
          <circle cx="60" cy="65" fill={laneColor} r="5" />
        </svg>
        <div className="oc-hud-gauge-value">{health}%</div>
        <div className="oc-hud-gauge-label">Health</div>
      </div>

      <div className="oc-hud-meters">
        <Meter color="#00f5ff" label="Evidence" max={20} value={evidence} />
        <Meter color="#EF5A2A" label="Trap tests" max={12} value={tests} />
        <Meter color={failures > 0 ? '#e0533f' : '#22ff88'} label="Failures" max={10} value={failures} />
      </div>

      <div className="oc-hud-chips">
        <span className={`oc-hud-chip ${shipReady ? 'pass' : 'warn'}`}>
          {shipReady ? '✓ SHIP CLEAR' : '⚠ GATE BLOCKED'}
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