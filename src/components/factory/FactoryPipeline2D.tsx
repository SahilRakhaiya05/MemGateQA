import { motion } from 'framer-motion';
import { STATIONS, STATUS_TO_STATION, type StationId } from './stations';

interface FactoryPipeline2DProps {
  status: string;
  running?: boolean;
  jammed?: boolean;
  compact?: boolean;
}

function statusToStation(status: string): StationId {
  return STATUS_TO_STATION[status] ?? 'intake';
}

export function FactoryPipeline2D({ status, running = true, jammed = false, compact = false }: FactoryPipeline2DProps) {
  const active = statusToStation(status);
  const activeIdx = STATIONS.findIndex((s) => s.id === active);
  const progress = STATIONS.length > 1 ? (activeIdx / (STATIONS.length - 1)) * 100 : 0;

  return (
    <div className={`factory-pipeline ${compact ? 'compact' : ''} ${jammed ? 'jammed' : ''}`}>
      <div className="factory-pipeline-belt">
        <div className={`conveyor-tread ${running ? '' : 'paused'} ${jammed ? 'slow' : ''}`} />
        <div className="conveyor-rail top" />
        <div className="conveyor-rail bot" />

        <div
          className={`factory-pipeline-carrier ${running ? 'looping' : 'parked'}`}
          style={{ '--station-left': `${5 + progress * 0.85}%` } as React.CSSProperties}
        >
          <div className="factory-pipeline-folder">
            <div className="arena-folder-tape" />
            <div className="arena-folder-label" />
          </div>
        </div>
      </div>

      <div className="factory-pipeline-track">
        <div className="factory-pipeline-rail">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="factory-pipeline-rail-fill"
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
                animate={isActive ? { y: [0, -3, 0] } : {}}
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
    </div>
  );
}