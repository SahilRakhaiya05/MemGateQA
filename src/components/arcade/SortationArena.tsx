import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { CogneeBridgeChip } from '../CogneeBridgeChip';
import { ConveyorBelt, type BeltPacket } from '../ConveyorBelt';
import { StationTrack } from '../factory/StationTrack';
import { ArcadeCabinet } from './ArcadeCabinet';
import { CogneeLaneBooth } from './CogneeLaneBooth';
import { CogneeLivePanel } from './CogneeLivePanel';
import { FactoryHUD } from './FactoryHUD';
import { FocusFolderCard } from './FocusFolderCard';
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

  const [focusId, setFocusId] = useState<string | null>(null);
  const [thwack, setThwack] = useState(false);
  const prevIndexed = useRef(indexedCount);

  useEffect(() => {
    if (packets.length === 0) {
      setFocusId(null);
      return;
    }
    if (!focusId || !packets.some((p) => p.id === focusId)) {
      const next = packets.find((p) => !p.indexed) ?? packets[0];
      setFocusId(next.id);
    }
  }, [packets, focusId]);

  useEffect(() => {
    if (beltFast) {
      const next = packets.find((p) => !p.indexed);
      if (next) setFocusId(next.id);
    }
  }, [beltFast, packets]);

  useEffect(() => {
    if (indexedCount > prevIndexed.current) {
      setThwack(true);
      const t = setTimeout(() => setThwack(false), 900);
      prevIndexed.current = indexedCount;
      return () => clearTimeout(t);
    }
    prevIndexed.current = indexedCount;
  }, [indexedCount]);

  const focusPacket = packets.find((p) => p.id === focusId) ?? null;

  return (
    <ArcadeCabinet compact={compact} subtitle={subtitle} title="SORTATION ARENA">
      <div className={`sortation-arena ${compact ? 'compact' : ''}`}>
        <div className="sortation-arena-top">
          <div className="sortation-arena-live">
            <span className="sortation-live-dot" />
            <span className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">
              {beltFast ? 'Indexing memory…' : beltLive ? 'Belt live' : 'Standby'}
            </span>
            <CogneeBridgeChip dataset={dataset} indexed={indexedCount} pending={pending} />
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
            focusId={focusId}
            footLeft="Queue"
            footRight="Indexed"
            onFocusChange={setFocusId}
            packets={packets}
            running={beltLive}
            showCount={false}
          />

          <FocusFolderCard beltFast={beltFast} packet={focusPacket} thwack={thwack} />

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
          <HandlerBooth
            agent={agent}
            failures={failures}
            score={score}
            stamping={beltFast}
            status={status}
            stressOverride={stressOverride}
          />

          <div className="sortation-arena-center">
            <FactoryHUD
              evidence={evidenceCount}
              failures={failures}
              laneColor="#EF5A2A"
              score={score}
              status={status}
              tests={testsCount}
            />
            <CogneeLivePanel
              beltFast={beltFast}
              caseId={caseId}
              dataset={dataset}
              indexed={indexedCount}
              pending={pending}
            />
          </div>

          <CogneeLaneBooth beltFast={beltFast} dataset={dataset} indexed={indexedCount} pending={pending} />
        </div>

        {actionSlot ? <div className="sortation-arena-action">{actionSlot}</div> : null}
      </div>
    </ArcadeCabinet>
  );
}