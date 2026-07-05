import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { CogneeBridgeChip } from '../CogneeBridgeChip';
import { ConveyorBelt, type BeltPacket } from '../ConveyorBelt';
import { StationTrack } from '../factory/StationTrack';
import { useBeltPreview } from '../../hooks/useBeltPreview';
import { beltVisuals, deriveBeltMode } from '../../lib/beltState';
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
  gateRunning?: boolean;
  gatePhase?: string | null;
  /** Evidence page INDEX — brief fast belt without full gate */
  manualIndexing?: boolean;
  stressOverride?: ArenaStress;
  activeLifecycle?: string[];
  lastLifecycleOp?: string;
  hasResults?: boolean;
  compact?: boolean;
  actionSlot?: ReactNode;
  phaseLabel?: string;
  qaStressOverride?: ArenaStress;
  cogneeStressOverride?: ArenaStress;
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
  gateRunning = false,
  gatePhase = null,
  manualIndexing = false,
  stressOverride,
  activeLifecycle = [],
  lastLifecycleOp,
  hasResults = false,
  compact = false,
  actionSlot,
  phaseLabel,
  qaStressOverride,
  cogneeStressOverride,
}: SortationArenaProps) {
  const packetIds = useMemo(() => packets.map((p) => p.id), [packets]);
  const { previewActive, previewFocusId } = useBeltPreview(caseId, packetIds, gateRunning);

  const beltMode =
    manualIndexing && !gateRunning ? 'indexing' : deriveBeltMode(gateRunning, gatePhase, previewActive);
  const visuals = beltVisuals(beltMode);
  const displayPhase = phaseLabel ?? visuals.label;

  const pending = Math.max(0, evidenceCount - indexedCount);
  const subtitle = [agent, dataset].filter(Boolean).join(' · ') || 'Memory gate inspection';

  const [manualFocusId, setManualFocusId] = useState<string | null>(null);
  const [thwack, setThwack] = useState(false);
  const prevIndexed = useRef(indexedCount);
  const userPickedFocus = useRef(false);

  const focusId =
    previewFocusId ??
    (userPickedFocus.current && manualFocusId ? manualFocusId : null) ??
    manualFocusId ??
    packets.find((p) => !p.indexed)?.id ??
    packets[0]?.id ??
    null;

  useEffect(() => {
    if (previewActive) userPickedFocus.current = false;
  }, [previewActive]);

  useEffect(() => {
    if (packets.length === 0) {
      setManualFocusId(null);
      userPickedFocus.current = false;
      return;
    }
    if (!manualFocusId || !packets.some((p) => p.id === manualFocusId)) {
      const next = packets.find((p) => !p.indexed) ?? packets[0];
      setManualFocusId(next.id);
    }
  }, [packets, manualFocusId]);

  useEffect(() => {
    if (beltMode === 'indexing') {
      const next = packets.find((p) => !p.indexed);
      if (next) setManualFocusId(next.id);
    }
  }, [beltMode, packets]);

  useEffect(() => {
    if (indexedCount > prevIndexed.current) {
      setThwack(true);
      const t = window.setTimeout(() => setThwack(false), 900);
      prevIndexed.current = indexedCount;
      return () => window.clearTimeout(t);
    }
    prevIndexed.current = indexedCount;
  }, [indexedCount]);

  useEffect(() => {
    if (score != null && score >= 80 && hasResults) {
      setThwack(true);
      const t = window.setTimeout(() => setThwack(false), 1200);
      return () => window.clearTimeout(t);
    }
  }, [score, hasResults]);

  const handleFocusChange = (id: string) => {
    userPickedFocus.current = true;
    setManualFocusId(id);
  };

  const focusPacket = packets.find((p) => p.id === focusId) ?? null;
  const jammed = failures > 3;

  return (
    <ArcadeCabinet compact={compact} subtitle={subtitle} title="MEMORY GATE">
      <div className={`sortation-arena ${compact ? 'compact' : ''}`}>
        <div className="sortation-arena-top">
          <div className="sortation-arena-live">
            <span className="sortation-live-dot" />
            <span className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">{displayPhase}</span>
            <CogneeBridgeChip
              activeOps={activeLifecycle}
              dataset={dataset}
              indexed={indexedCount}
              lastOp={lastLifecycleOp}
              pending={pending}
            />
          </div>

          <div className="factory-ticket sortation-arena-ticket">
            <div className="factory-ticket-head">#{orderTag(caseId)}</div>
            <div className="factory-ticket-body">
              <div className="truncate font-medium text-white">{caseName ?? 'Audit'}</div>
              <div className="mt-1">
                <span className="text-slate-500">Stage </span>
                <strong className="text-theme-accent">{status}</strong>
              </div>
              {scoreBefore != null ? <div className="text-slate-500 text-xs">Was {scoreBefore}%</div> : null}
            </div>
          </div>
        </div>

        <div className="sortation-arena-stage">
          <ConveyorBelt
            embedded
            fast={visuals.fast}
            focusId={focusId}
            footLeft="Queue"
            footRight="Indexed"
            onFocusChange={handleFocusChange}
            packets={packets}
            phaseLabel={gateRunning || previewActive ? displayPhase : undefined}
            running={visuals.running}
            showCount={false}
            slow={visuals.slow}
          />

          <FocusFolderCard
            beltFast={visuals.fast}
            packet={focusPacket}
            reading={beltMode === 'preview'}
            thwack={thwack}
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
          <HandlerBooth
            agent={agent}
            failures={failures}
            hasResults={hasResults}
            score={score}
            stamping={visuals.fast}
            status={status}
            stressOverride={qaStressOverride ?? stressOverride}
          />

          <div className="sortation-arena-center">
            <FactoryHUD
              evidence={evidenceCount}
              failures={failures}
              hasResults={hasResults}
              laneColor="#EF5A2A"
              score={score}
              status={status}
              tests={testsCount}
            />
            <CogneeLivePanel beltFast={visuals.fast} caseId={caseId} />
          </div>

          <CogneeLaneBooth
            beltFast={visuals.fast}
            dataset={dataset}
            indexed={indexedCount}
            pending={pending}
            stressOverride={cogneeStressOverride}
          />
        </div>

        {actionSlot ? <div className="sortation-arena-action">{actionSlot}</div> : null}
      </div>
    </ArcadeCabinet>
  );
}