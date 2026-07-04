import { motion } from 'framer-motion';
import type { HealthBreakdown } from '../api/memgateqaApi';

const DIMS: { key: keyof HealthBreakdown; label: string }[] = [
  { key: 'evidenceGrounding', label: 'Ground' },
  { key: 'freshness', label: 'Fresh' },
  { key: 'premiseResistance', label: 'Premise' },
  { key: 'contradictionConsistency', label: 'Consist' },
  { key: 'privacyLeakResistance', label: 'Privacy' },
  { key: 'forgetSuccess', label: 'Forget' },
];

interface ComplianceRadarProps {
  breakdown: HealthBreakdown;
}

export function ComplianceRadar({ breakdown }: ComplianceRadarProps) {
  const values = DIMS.map((d) => breakdown[d.key] ?? 0);
  const cx = 100;
  const cy = 100;
  const maxR = 72;
  const angleStep = (Math.PI * 2) / DIMS.length;

  const points = values
    .map((v, i) => {
      const r = (v / 100) * maxR;
      const a = i * angleStep - Math.PI / 2;
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    })
    .join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="compliance-radar">
      <p className="font-hud text-[9px] uppercase tracking-widest text-[var(--accent)]">Gate radar</p>
      <svg className="compliance-radar-svg" viewBox="0 0 200 200">
        {gridLevels.map((lvl) => (
          <polygon
            key={lvl}
            fill="none"
            points={DIMS.map((_, i) => {
              const a = i * angleStep - Math.PI / 2;
              const r = maxR * lvl;
              return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
            }).join(' ')}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        {DIMS.map((d, i) => {
          const a = i * angleStep - Math.PI / 2;
          const x = cx + Math.cos(a) * maxR;
          const y = cy + Math.sin(a) * maxR;
          const lx = cx + Math.cos(a) * (maxR + 18);
          const ly = cy + Math.sin(a) * (maxR + 18);
          return (
            <g key={d.key}>
              <line stroke="rgba(255,255,255,0.06)" x1={cx} x2={x} y1={cy} y2={y} />
              <text fill="#94a3b8" fontSize="8" textAnchor="middle" x={lx} y={ly + 3}>
                {d.label}
              </text>
            </g>
          );
        })}
        <motion.polygon
          animate={{ opacity: 1 }}
          fill="var(--primary-glow)"
          initial={{ opacity: 0 }}
          points={points}
          stroke="var(--primary)"
          strokeWidth="2"
          transition={{ duration: 0.8 }}
        />
      </svg>
      <div className="compliance-radar-legend">
        {DIMS.map((d) => (
          <span key={d.key} className="compliance-radar-chip">
            {d.label} <strong>{breakdown[d.key] ?? 0}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}