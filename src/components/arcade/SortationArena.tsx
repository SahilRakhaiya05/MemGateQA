import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ConveyorBelt, type BeltPacket } from '../ConveyorBelt';
import { CogneeBridgeChip } from '../CogneeBridgeChip';
import { FactoryPipeline2D } from '../factory/FactoryPipeline2D';
import { ArcadeCabinet } from './ArcadeCabinet';
import { FactoryHUD } from './FactoryHUD';
import { HandlerBooth } from './HandlerBooth';

export type ArenaStress = 'calm' | 'focused' | 'strained' | 'drowning' | 'winning';

interface SortationArenaProps {
  caseId?: string;
  caseName?: string;
  dataset?: string;
  status: string;
  score?: number | null;
  scoreBefore?: number | null;
  failures?: number;
  evidenceCount?: number;
  testsCount?: number;
  indexedCount?: number;
  packets?: BeltPacket[];
  beltRunning?: boolean;
  beltFast?: boolean;
  stressOverride?: ArenaStress;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  actionSlot?: ReactNode;
}

function orderTag(caseId?: string, caseName?: string) {
  const tag = caseId ? caseId.replace('case-', '').slice(0, 6).toUpperCase() : 'NEW';
  return { tag, name: caseName ?? 'Memory audit' };
}

export function SortationArena({
  caseId,
  caseName,
  dataset,
  status,
  score,
  scoreBefore,
  failures = 0,
  evidenceCount = 0,
  testsCount = 0,
  indexedCount = 0,
  packets = [],
  beltRunning,
  beltFast = false,
  stressOverride,
  compact = false,
  title = 'MEMORY QA SORTATION ARENA',
  subtitle = '2D sortation line · belt · handler · HUD',
  actionSlot,
}: SortationArenaProps) {
  const jammed = failures > 3;
  const beltLive = beltRunning ?? packets.length > 0;
  const order = orderTag(caseId, caseName);

  return (
    <ArcadeCabinet compact={compact} subtitle={subtitle} title={title}>
      <div className={`sortation-arena ${compact ? 'compact' : ''}`}>
        {dataset ? (
          <CogneeBridgeChip dataset={dataset} indexed={indexedCount} pending={Math.max(0, evidenceCount - indexedCount)} />
        ) : null}

        <div className="sortation-arena-grid">
          <div className="sortation-arena-pipeline">
            <p className="sortation-arena-label font-hud text-[9px] uppercase tracking-widest text-slate-500">
              Lifecycle pipeline
            </p>
            <FactoryPipeline2D compact={compact} jammed={jammed} running status={status} />
            {jammed ? (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                className="factory-jam-badge sortation-jam"
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                +{failures} BACKLOG JAM
              </motion.span>
            ) : null}
          </div>

          <div className="sortation-arena-ticket factory-ticket">
            <div className="factory-ticket-head">ORDER #{order.tag}</div>
            <div className="factory-ticket-body">
              <div className="truncate font-medium text-white">{order.name}</div>
              <div className="mt-1">
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
                    animate={{ scale: [1, 1.08, 1] }}
                    className={score >= 80 ? 'text-neon-green' : 'text-neon-orange'}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    {score}%
                  </motion.span>
                </div>
              ) : (
                <div className="text-slate-500">Awaiting interrogation…</div>
              )}
            </div>
          </div>

          <div className="sortation-arena-belt">
            <p className="sortation-arena-label font-hud text-[9px] uppercase tracking-widest text-slate-500">
              Evidence conveyor
            </p>
            <ConveyorBelt
              fast={beltFast}
              label="Intake belt"
              packets={packets}
              running={beltLive}
            />
          </div>

          <div className="sortation-arena-booths">
            <HandlerBooth failures={failures} score={score} status={status} stressOverride={stressOverride} />
            <div className="handler-booth handler-booth-ghost stress-calm">
              <div className="handler-booth-frame handler-ghost-frame">
                <span className="handler-ghost-icon">🧠</span>
              </div>
              <p className="handler-label font-hud text-[9px] uppercase tracking-wider">Cognee lane</p>
              <p className="handler-sub text-xs text-slate-500">recall() · graph</p>
            </div>
            <FactoryHUD
              evidence={evidenceCount}
              failures={failures}
              laneColor="#EF5A2A"
              score={score}
              status={status}
              tests={testsCount}
            />
          </div>
        </div>

        {actionSlot ? <div className="sortation-arena-action">{actionSlot}</div> : null}
      </div>
    </ArcadeCabinet>
  );
}