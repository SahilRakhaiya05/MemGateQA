import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ConveyorBelt, type BeltPacket } from '../ConveyorBelt';
import { StationTrack } from '../factory/StationTrack';
import { ArcadeCabinet } from './ArcadeCabinet';
import { FactoryHUD } from './FactoryHUD';
import { HandlerBooth } from './HandlerBooth';

export type ArenaStress = 'calm' | 'focused' | 'strained' | 'drowning' | 'winning';

interface SortationArenaProps {
  caseId?: string;
  caseName?: string;
  agent?: string;
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
  actionSlot?: ReactNode;
}

function orderTag(caseId?: string) {
  return caseId ? caseId.replace('case-', '').slice(0, 6).toUpperCase() : 'NEW';
}

export function SortationArena({
  caseId,
  caseName,
  agent,
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
  actionSlot,
}: SortationArenaProps) {
  const jammed = failures > 3;
  const beltLive = beltRunning ?? packets.length > 0;
  const pending = Math.max(0, evidenceCount - indexedCount);
  const subtitle = [agent, dataset].filter(Boolean).join(' · ') || 'Memory QA sortation';

  return (
    <ArcadeCabinet compact={compact} subtitle={subtitle} title="SORTATION ARENA">
      <div className={`sortation-arena ${compact ? 'compact' : ''}`}>
        <div className="sortation-arena-top">
          <div className="sortation-arena-live">
            <span className="sortation-live-dot" />
            <span className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">
              {beltFast ? 'Indexing memory…' : beltLive ? 'Belt live' : 'Standby'}
            </span>
            {dataset ? (
              <code className="sortation-dataset-tag">{dataset}</code>
            ) : null}
            {pending > 0 ? (
              <span className="sortation-meta-tag">{pending} queued</span>
            ) : indexedCount > 0 ? (
              <span className="sortation-meta-tag">{indexedCount} in Cognee</span>
            ) : null}
          </div>

          <div className="factory-ticket sortation-arena-ticket">
            <div className="factory-ticket-head">#{orderTag(caseId)}</div>
            <div className="factory-ticket-body">
              <div className="truncate font-medium text-white">{caseName ?? 'Audit'}</div>
              <div className="mt-1">
                <span className="text-slate-500">Stage </span>
                <strong className="text-theme-accent">{status}</strong>
              </div>
              {score != null ? (
                <div className="factory-ticket-score">
                  Health{' '}
                  <motion.span
                    animate={{ scale: [1, 1.06, 1] }}
                    className={score >= 80 ? 'text-neon-green' : 'text-neon-orange'}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    {score}%
                  </motion.span>
                  {scoreBefore != null ? (
                    <span className="text-slate-500"> · was {scoreBefore}%</span>
                  ) : null}
                </div>
              ) : (
                <div className="text-slate-500">Run trap tests</div>
              )}
            </div>
          </div>
        </div>

        <div className="sortation-arena-stage">
          <ConveyorBelt
            embedded
            fast={beltFast}
            footLeft="Queue"
            footRight="Indexed"
            packets={packets}
            running={beltLive}
            showCount={false}
          />

          {jammed ? (
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              className="factory-jam-badge sortation-jam"
              transition={{ duration: 0.7, repeat: Infinity }}
            >
              +{failures} JAM
            </motion.span>
          ) : null}

          <StationTrack compact={compact} status={status} />
        </div>

        <div className="sortation-arena-booths">
          <HandlerBooth agent={agent} failures={failures} score={score} status={status} stressOverride={stressOverride} />
          <FactoryHUD
            evidence={evidenceCount}
            failures={failures}
            laneColor="#EF5A2A"
            score={score}
            status={status}
            tests={testsCount}
          />
        </div>

        {actionSlot ? <div className="sortation-arena-action">{actionSlot}</div> : null}
      </div>
    </ArcadeCabinet>
  );
}