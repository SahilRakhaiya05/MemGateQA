import { motion } from 'framer-motion';

export type FactoryStationId = 'intake' | 'remember' | 'interrogate' | 'surgery' | 'rerun' | 'ship';

const STATIONS: { id: FactoryStationId; label: string; icon: string; cogneeOp?: string }[] = [
  { id: 'intake', label: 'Intake', icon: '📥' },
  { id: 'remember', label: 'Remember', icon: '🧠', cogneeOp: 'remember' },
  { id: 'interrogate', label: 'Interrogate', icon: '🔍', cogneeOp: 'recall' },
  { id: 'surgery', label: 'Surgery', icon: '🔧', cogneeOp: 'improve' },
  { id: 'rerun', label: 'Rerun', icon: '♻️', cogneeOp: 'recall' },
  { id: 'ship', label: 'Ship', icon: '📋', cogneeOp: 'forget' },
];

const STATUS_TO_STATION: Record<string, FactoryStationId> = {
  open: 'intake',
  intake: 'remember',
  tested: 'interrogate',
  surgery: 'surgery',
  repaired: 'rerun',
  closed: 'ship',
};

interface FactoryFloorProps {
  status: string;
  score?: number | null;
  scoreBefore?: number | null;
  compact?: boolean;
}

export function statusToStation(status: string): FactoryStationId {
  return STATUS_TO_STATION[status] ?? 'intake';
}

export function FactoryFloor({ status, score, scoreBefore, compact = false }: FactoryFloorProps) {
  const active = statusToStation(status);
  const activeIdx = STATIONS.findIndex((s) => s.id === active);

  return (
    <div className={`factory-floor-wrap ${compact ? 'factory-floor-compact' : ''}`}>
      <div className="factory-floor-header">
        <span className="factory-floor-title">Memory QA Assembly Line</span>
        {!compact && (
          <span className="factory-floor-sub">
            Overcooked-style factory · Cognee lifecycle on every station
          </span>
        )}
      </div>

      <div className="factory-scene">
        <div className="factory-tile-floor" />
        <div className="factory-steam factory-steam-1" />
        <div className="factory-steam factory-steam-2" />

        <div className="factory-stations">
          {STATIONS.map((station, idx) => {
            const isActive = station.id === active;
            const isDone = idx < activeIdx;
            const isNext = idx === activeIdx + 1;
            return (
              <motion.div
                key={station.id}
                animate={isActive ? { y: [0, -4, 0] } : {}}
                className={`factory-station ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isNext ? 'next' : ''}`}
                transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
              >
                <div className="factory-station-counter">
                  <span className="factory-station-icon">{station.icon}</span>
                  {isActive ? <div className="factory-bot">🤖</div> : null}
                  {isActive ? <div className="factory-steam-puff" /> : null}
                </div>
                <div className="factory-station-label">{station.label}</div>
                {station.cogneeOp ? (
                  <div className="factory-station-op font-hud">{station.cogneeOp}()</div>
                ) : null}
                {idx < STATIONS.length - 1 ? <div className="factory-belt-link" /> : null}
              </motion.div>
            );
          })}
        </div>

        <div className="factory-order-ticket">
          <div className="factory-ticket-header">ORDER #WOLF</div>
          <div className="factory-ticket-body">
            <div>Status: <strong>{status}</strong></div>
            {scoreBefore != null ? <div>Before: <span className="text-red-300">{scoreBefore}%</span></div> : null}
            {score != null ? (
              <div className="factory-ticket-score">
                Health: <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.5 }}>{score}%</motion.span>
              </div>
            ) : (
              <div className="text-slate-500">Awaiting interrogation…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}