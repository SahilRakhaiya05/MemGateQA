import { motion } from 'framer-motion';
import type { HealthBreakdown } from '../api/memgateqaApi';

interface HealthScoreGaugeProps {
  score: number;
  before?: number | null;
  breakdown?: HealthBreakdown;
  size?: 'sm' | 'lg';
}

const DIMS: { key: keyof HealthBreakdown; label: string }[] = [
  { key: 'evidenceGrounding', label: 'Grounding' },
  { key: 'freshness', label: 'Freshness' },
  { key: 'premiseResistance', label: 'Premise' },
  { key: 'contradictionConsistency', label: 'Consistency' },
  { key: 'privacyLeakResistance', label: 'Privacy' },
  { key: 'forgetSuccess', label: 'Forget' },
];

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-300';
  return 'text-red-400';
}

function ringColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

export function HealthScoreGauge({ score, before, breakdown, size = 'lg' }: HealthScoreGaugeProps) {
  const r = size === 'lg' ? 54 : 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const big = size === 'lg';

  return (
    <div className={`health-gauge ${big ? 'health-gauge-lg' : 'health-gauge-sm'}`}>
      <div className={`health-gauge-ring-wrap ${big ? 'health-gauge-ring-lg' : 'health-gauge-ring-sm'}`}>
        <svg className="health-gauge-ring" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" fill="none" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <motion.circle
            animate={{ strokeDashoffset: offset }}
            cx="60"
            cy="60"
            fill="none"
            initial={{ strokeDashoffset: circ }}
            r={r}
            stroke={ringColor(score)}
            strokeDasharray={circ}
            strokeLinecap="round"
            strokeWidth="10"
            transform="rotate(-90 60 60)"
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="health-gauge-center">
          <motion.div
            animate={{ scale: [0.9, 1] }}
            className={`health-gauge-score font-sig font-bold ${scoreColor(score)}`}
            initial={{ scale: 0.8 }}
          >
            {score}
          </motion.div>
          <div className="health-gauge-label font-hud uppercase text-slate-500">Health</div>
        </div>
      </div>
      {before != null && before !== score ? (
        <div className="health-gauge-delta font-hud text-slate-400">
          <span className="text-red-400">{before}</span>
          <span className="health-gauge-delta-arrow" aria-hidden>→</span>
          <span className="text-emerald-400">{score}</span>
        </div>
      ) : null}

      {breakdown && big ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DIMS.map(({ key, label }) => {
            const val = breakdown[key] ?? 0;
            return (
              <div key={key} className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5">
                <div className="font-hud text-[9px] uppercase text-slate-500">{label}</div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${val}%` }}
                    className={`h-full rounded-full ${val >= 70 ? 'bg-emerald-400' : val >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                    initial={{ width: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <div className="mt-0.5 font-hud text-[10px] text-slate-400">{val}%</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}