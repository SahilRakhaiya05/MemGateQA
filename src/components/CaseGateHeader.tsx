import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ConveyorBelt, type BeltPacket } from './ConveyorBelt';
import { GateVerifier, type VerifierStress } from './GateVerifier';
import { MemoryLifecyclePills } from './MemoryLifecyclePills';
import { useCogneeBridge } from '../hooks/useCogneeBridge';
import { getGatePhase, gatePhaseLabel, gatePhaseScore } from '../lib/gateStatus';

interface CaseGateHeaderProps {
  caseId: string;
  caseName: string;
  agent?: string;
  dataset?: string;
  status: string;
  score?: number | null;
  failures?: number;
  evidenceCount?: number;
  testsCount?: number;
  indexedCount?: number;
  packets?: BeltPacket[];
  beltFast?: boolean;
  activeLifecycle?: string[];
  lastLifecycleOp?: string;
  hasResults?: boolean;
}

function orderTag(caseId: string) {
  return caseId.replace('case-', '').slice(0, 6).toUpperCase();
}

function qaStress(
  score: number | null | undefined,
  failures: number,
  status: string,
  hasResults: boolean,
  beltFast: boolean,
): VerifierStress {
  if (beltFast) return 'focused';
  if (!hasResults && score == null) return 'calm';
  if ((score ?? 0) >= 80 || status === 'closed' || status === 'repaired') return 'winning';
  if (failures > 3 || (score != null && score < 35)) return 'drowning';
  if (failures > 0 || (score != null && score < 80)) return 'strained';
  return 'focused';
}

function cogneeStress(
  live: boolean,
  mock: boolean,
  beltFast: boolean,
  pending: number,
  indexed: number,
): VerifierStress {
  if (!live && !mock) return 'drowning';
  if (beltFast) return 'focused';
  if (pending === 0 && indexed > 0) return 'winning';
  if (!live && mock) return 'strained';
  return 'calm';
}

const QA_LABEL: Record<VerifierStress, string> = {
  calm: 'Verifier ready',
  focused: 'Indexing / traps',
  strained: 'Failures detected',
  drowning: 'Gate blocked',
  winning: 'Ship cleared',
};

const COGNEE_LABEL: Record<VerifierStress, string> = {
  calm: 'Cognee standby',
  focused: 'remember() active',
  strained: 'Mock bridge',
  drowning: 'Bridge offline',
  winning: 'Graph synced',
};

export function CaseGateHeader({
  caseId,
  caseName,
  agent,
  dataset,
  status,
  score,
  failures = 0,
  evidenceCount = 0,
  testsCount = 0,
  indexedCount = 0,
  packets = [],
  beltFast = false,
  activeLifecycle = [],
  lastLifecycleOp,
  hasResults = false,
}: CaseGateHeaderProps) {
  const { health } = useCogneeBridge();
  const live = Boolean(health?.cognee_reachable);
  const mock = health?.mode === 'mock';
  const pending = Math.max(0, evidenceCount - indexedCount);
  const phase = getGatePhase(score, hasResults);
  const queued = Math.max(0, packets.length - packets.filter((p) => p.indexed).length);

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
    if (indexedCount > prevIndexed.current) {
      setThwack(true);
      const t = setTimeout(() => setThwack(false), 700);
      prevIndexed.current = indexedCount;
      return () => clearTimeout(t);
    }
    prevIndexed.current = indexedCount;
  }, [indexedCount]);

  const focusPacket = packets.find((p) => p.id === focusId) ?? null;
  const qa = qaStress(score, failures, status, hasResults, beltFast);
  const cognee = cogneeStress(live, mock, beltFast, pending, indexedCount);
  const beltRunning = beltFast || packets.length > 0;

  const gaugeColor = useMemo(() => {
    if (phase === 'clear') return '#22ff88';
    if (phase === 'blocked') return '#e0533f';
    return '#64748b';
  }, [phase]);

  const needleAngle = score != null ? -90 + (score / 100) * 180 : -90;

  return (
    <section className={`case-gate-header phase-${phase}`}>
      <div className="case-gate-header-top">
        <div className="case-gate-header-title">
          <p className="font-hud text-[9px] uppercase tracking-widest text-slate-500">Memory gate</p>
          <h1 className="font-sig text-lg font-bold text-white">{caseName}</h1>
          <p className="case-gate-header-meta">{agent ?? 'QA audit'} · {dataset ?? 'default'}</p>
        </div>

        <div className="case-gate-header-badges">
          <span className="case-gate-order">#{orderTag(caseId)}</span>
          <span className={`case-gate-phase ${phase}`}>{gatePhaseLabel(phase)}</span>
          <span className="case-gate-score">{gatePhaseScore(score)}</span>
          <span className="case-gate-status">{status}</span>
        </div>
      </div>

      <MemoryLifecyclePills active={activeLifecycle} compact fnStyle showHeading={false} />

      <div className="case-gate-belt-row">
        <ConveyorBelt
          embedded
          fast={beltFast}
          focusId={focusId}
          footLeft={`Queue · ${queued}`}
          footRight={`Indexed · ${indexedCount}`}
          onFocusChange={setFocusId}
          packets={packets}
          running={beltRunning}
          showCount={false}
        />
        {focusPacket ? (
          <motion.div
            animate={thwack ? { scale: [1, 1.03, 1] } : {}}
            className={`case-gate-focus ${focusPacket.private ? 'private' : ''} ${focusPacket.indexed ? 'indexed' : ''}`}
            key={focusPacket.id}
          >
            <p className="font-hud text-[8px] uppercase tracking-wider text-slate-500">Active</p>
            <p className="case-gate-focus-title">{focusPacket.title}</p>
            <p className="case-gate-focus-state">
              {focusPacket.indexed ? 'In Cognee' : beltFast ? 'Indexing…' : 'Queued'}
            </p>
          </motion.div>
        ) : null}
      </div>

      <div className="case-gate-characters">
        <div className={`case-gate-booth qa stress-${qa}`}>
          <GateVerifier size="sm" stamping={beltFast} stress={qa} variant="qa" />
          <div>
            <p className="case-gate-booth-label">{QA_LABEL[qa]}</p>
            <p className="case-gate-booth-sub">QA verifier · {failures} failures</p>
          </div>
        </div>

        <div className="case-gate-gauge">
          <svg aria-hidden className="case-gate-gauge-svg" viewBox="0 0 120 76">
            <path d="M15 65 A50 50 0 0 1 105 65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
            <path
              d="M15 65 A50 50 0 0 1 105 65"
              fill="none"
              stroke={gaugeColor}
              strokeDasharray={score != null ? `${(score / 100) * 157} 157` : '0 157'}
              strokeLinecap="round"
              strokeWidth="7"
            />
            <motion.g animate={{ rotate: needleAngle }} style={{ transformOrigin: '60px 65px' }}>
              <line stroke="rgba(255,255,255,0.9)" strokeLinecap="round" strokeWidth="2" x1="60" x2="60" y1="65" y2="32" />
            </motion.g>
            <circle cx="60" cy="65" fill="#EF5A2A" r="4.5" />
          </svg>
          <div className="case-gate-gauge-text">
            <span className="case-gate-gauge-val">{gatePhaseScore(score)}</span>
            <span className="case-gate-gauge-lbl">Health</span>
          </div>
          <div className="case-gate-stats">
            <span>{evidenceCount} evidence</span>
            <span>{testsCount} traps</span>
            {lastLifecycleOp ? <span className="case-gate-last-op">{lastLifecycleOp}()</span> : null}
          </div>
        </div>

        <div className={`case-gate-booth cognee stress-${cognee}`}>
          <GateVerifier size="sm" stamping={beltFast} stress={cognee} variant="cognee" />
          <div>
            <p className="case-gate-booth-label">{COGNEE_LABEL[cognee]}</p>
            <p className="case-gate-booth-sub">
              Cognee · {pending > 0 ? `${pending} queued` : `${indexedCount} indexed`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}