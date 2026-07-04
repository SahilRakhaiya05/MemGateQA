import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArcadeCabinet } from './arcade/ArcadeCabinet';
import { HandlerBooth } from './arcade/HandlerBooth';
import { FactoryHUD } from './arcade/FactoryHUD';
import { STATIONS_3D, STATUS_TO_STATION_3D, type Station3DId } from './factory3d/theme';

const Factory3DCanvas = lazy(() =>
  import('./factory3d/Factory3DCanvas').then((m) => ({ default: m.Factory3DCanvas })),
);

export type FactoryStationId = 'intake' | 'remember' | 'interrogate' | 'surgery' | 'rerun' | 'ship';

interface FactoryFloorProps {
  status: string;
  score?: number | null;
  scoreBefore?: number | null;
  compact?: boolean;
  failures?: number;
  evidence?: number;
  tests?: number;
}

function statusToStation3D(status: string): Station3DId {
  return STATUS_TO_STATION_3D[status] ?? 'intake';
}

export function statusToStation(status: string): FactoryStationId {
  return statusToStation3D(status) as FactoryStationId;
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
  const active = statusToStation3D(status);
  const activeIdx = STATIONS_3D.findIndex((s) => s.id === active);
  const jammed = failures > 3;

  return (
    <ArcadeCabinet
      compact={compact}
      subtitle="Live Three.js floor · Cognee lifecycle · drag to orbit"
      title="MEMORY QA SORTATION ARENA"
    >
      <div className={`factory-arena ${compact ? 'compact' : ''}`}>
        <div className="factory-arena-stage">
          <Suspense fallback={<div className="factory-3d-canvas-wrap" style={{ height: compact ? 220 : 400 }}><div className="case-skeleton h-full" /></div>}>
            <Factory3DCanvas compact={compact} jammed={jammed} running status={status} />
          </Suspense>

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

        <div className="factory-3d-hud">
          {STATIONS_3D.map((station, idx) => {
            const isActive = station.id === active;
            const isDone = idx < activeIdx;
            return (
              <motion.div
                key={station.id}
                animate={isActive ? { y: [0, -3, 0] } : {}}
                className={`factory-3d-hud-station ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                style={{ '--station-color': station.color } as React.CSSProperties}
                transition={{ duration: 1.2, repeat: isActive ? Infinity : 0 }}
              >
                <span className="factory-3d-hud-icon">{station.icon}</span>
                <span className="factory-3d-hud-label">{station.label}</span>
                {'op' in station && station.op ? (
                  <span className="factory-3d-hud-op">{station.op}()</span>
                ) : null}
                {isActive ? <span className="factory-3d-hud-pulse" /> : null}
              </motion.div>
            );
          })}
        </div>

        <div className="factory-3d-ticket factory-arena-ticket">
          <div className="factory-3d-ticket-head">ORDER #WOLF</div>
          <div className="factory-3d-ticket-body">
            <div>Status: <strong className="text-neon-cyan">{status}</strong></div>
            {scoreBefore != null ? <div>Before: <span className="text-neon-danger">{scoreBefore}%</span></div> : null}
            {score != null ? (
              <div className="factory-3d-ticket-score">
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