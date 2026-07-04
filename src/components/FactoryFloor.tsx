import { motion } from 'framer-motion';
import { ArcadeCabinet } from './arcade/ArcadeCabinet';
import { HandlerBooth } from './arcade/HandlerBooth';
import { FactoryHUD } from './arcade/FactoryHUD';
import { FactoryPipeline2D } from './factory/FactoryPipeline2D';
import { STATUS_TO_STATION, type StationId } from './factory/stations';

export type FactoryStationId = StationId;

interface FactoryFloorProps {
  status: string;
  score?: number | null;
  scoreBefore?: number | null;
  compact?: boolean;
  failures?: number;
  evidence?: number;
  tests?: number;
}

export function statusToStation(status: string): FactoryStationId {
  return STATUS_TO_STATION[status] ?? 'intake';
}

export function FactoryFloor({
  status,
  score,
  scoreBefore,
  compact = false,
  failures = 0,
  evidence = 0,
  tests = 0,
}: FactoryFloorProps) {
  const jammed = failures > 3;

  return (
    <ArcadeCabinet
      compact={compact}
      subtitle="2D sortation line · Cognee lifecycle stations"
      title="MEMORY QA SORTATION ARENA"
    >
      <div className={`factory-arena ${compact ? 'compact' : ''}`}>
        <div className="factory-arena-stage">
          <FactoryPipeline2D compact={compact} jammed={jammed} running status={status} />

          {jammed ? (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              className="factory-jam-badge"
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              +{failures} BACKLOG JAM
            </motion.div>
          ) : null}
        </div>

        <div className="factory-arena-lanes">
          <HandlerBooth failures={failures} score={score} status={status} />
          <FactoryHUD
            evidence={evidence}
            failures={failures}
            laneColor="#EF5A2A"
            score={score}
            status={status}
            tests={tests}
          />
        </div>

        <div className="factory-ticket factory-arena-ticket">
          <div className="factory-ticket-head">ORDER #WOLF</div>
          <div className="factory-ticket-body">
            <div>
              Status: <strong className="text-theme-accent">{status}</strong>
            </div>
            {scoreBefore != null ? (
              <div>
                Before: <span className="text-neon-danger">{scoreBefore}%</span>
              </div>
            ) : null}
            {score != null ? (
              <div className="factory-ticket-score">
                Health:{' '}
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  className={score >= 80 ? 'text-neon-green' : 'text-neon-orange'}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {score}%
                </motion.span>
              </div>
            ) : (
              <div className="text-slate-500">Awaiting interrogation…</div>
            )}
          </div>
        </div>
      </div>
    </ArcadeCabinet>
  );
}