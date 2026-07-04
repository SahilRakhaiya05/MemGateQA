import { motion } from 'framer-motion';
import { STATIONS, STATUS_TO_STATION, type StationId } from './stations';

interface StationTrackProps {
  status: string;
  compact?: boolean;
}

function statusToStation(status: string): StationId {
  return STATUS_TO_STATION[status] ?? 'intake';
}

/** Progress rail + station pills only — no second belt */
export function StationTrack({ status, compact = false }: StationTrackProps) {
  const active = statusToStation(status);
  const activeIdx = STATIONS.findIndex((s) => s.id === active);
  const progress = STATIONS.length > 1 ? (activeIdx / (STATIONS.length - 1)) * 100 : 0;

  return (
    <div className={`station-track ${compact ? 'compact' : ''}`}>
      <div className="station-track-rail">
        <motion.div
          animate={{ width: `${progress}%` }}
          className="station-track-fill"
          initial={{ width: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="factory-station-hud">
        {STATIONS.map((station, idx) => {
          const isActive = station.id === active;
          const isDone = idx < activeIdx;
          return (
            <motion.div
              key={station.id}
              animate={isActive ? { y: [0, -2, 0] } : {}}
              className={`factory-station-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              style={{ '--station-color': station.color } as React.CSSProperties}
              transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
            >
              <span className="factory-station-icon">{station.icon}</span>
              <span className="factory-station-label">{station.label}</span>
              {'op' in station && station.op ? (
                <span className="factory-station-op">{station.op}()</span>
              ) : null}
              {isActive ? <span className="factory-station-pulse" /> : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}