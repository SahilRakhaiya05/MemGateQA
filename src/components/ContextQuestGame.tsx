import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord, type TestItem } from '../api/memgateqaApi';
import { readSession, writeSession } from '../lib/safeStorage';
import { ArcadeCabinet } from './arcade/ArcadeCabinet';

const ROUNDS = 6;
const XP_PER_CORRECT = 100;
const XP_PER_LEVEL = 300;

const REPAIR_HINT: Record<string, string> = {
  improve: 'Run improve() — stale memory needs human-approved correction',
  remember: 'Run remember() — push the fresher fact into Cognee',
  forget: 'Run forget() — private data must leave the graph',
  'human-review': 'Human review — abstain until evidence exists',
  none: 'Decoy trap — no repair needed',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function questChoices(test: TestItem): { id: string; label: string; correct: boolean }[] {
  const correct = (test.expected || '').slice(0, 140);
  const decoys = [
    test.trap || 'Stale session log overrides current progress',
    'Confabulated answer — not in Cognee memory',
    'Leaked private data from vault',
  ].filter((d) => d && d !== correct);
  const picks = shuffle(decoys).slice(0, 2);
  return shuffle([
    { id: 'ok', label: correct || 'Matches indexed evidence', correct: true },
    { id: 'd1', label: picks[0] ?? 'Wrong recall path', correct: false },
    { id: 'd2', label: picks[1] ?? 'Unsupported claim', correct: false },
  ]);
}

function highScoreKey(caseId: string) {
  return `context-quest-best-${caseId}`;
}

export function ContextQuestGame({ caseId = 'case-atlas-research' }: { caseId?: string }) {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [round, setRound] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [bestXp, setBestXp] = useState(0);

  const deck = useMemo(() => {
    if (!caseData?.tests?.length) return [];
    const weighted = caseData.tests.filter((t) => (t.weight ?? 0) > 0);
    return shuffle(weighted.length ? weighted : caseData.tests).slice(0, ROUNDS);
  }, [caseData]);

  const evidenceById = useMemo(() => {
    const map = new Map<string, string>();
    (caseData?.evidence ?? []).forEach((e) => map.set(e.id, e.title || e.id));
    return map;
  }, [caseData]);

  const current = deck[round];
  const options = current ? questChoices(current) : [];
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpPct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  useEffect(() => {
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
    setRound(0);
    setXp(0);
    setStreak(0);
    setPicked(null);
    setUnlocked([]);
    setCorrect(0);
    setDone(false);
    const saved = readSession(highScoreKey(caseId));
    setBestXp(saved ? Number(saved) || 0 : 0);
  }, [caseId]);

  const pick = (id: string, isCorrect: boolean) => {
    if (picked || !current) return;
    setPicked(id);
    if (isCorrect) {
      const bonus = 1 + Math.min(streak, 4) * 0.25;
      const gain = Math.round(XP_PER_CORRECT * bonus);
      setXp((v) => v + gain);
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
      const crystal = current.evidenceIds?.[0];
      if (crystal) {
        const label = evidenceById.get(crystal) ?? crystal;
        setUnlocked((u) => (u.includes(label) ? u : [...u, label]));
      }
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      if (round + 1 >= deck.length) {
        setDone(true);
        setXp((finalXp) => {
          const prev = Number(readSession(highScoreKey(caseId)) || 0);
          if (finalXp > prev) writeSession(highScoreKey(caseId), String(finalXp));
          setBestXp(Math.max(prev, finalXp));
          return finalXp;
        });
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, 1100);
  };

  const reset = () => {
    setRound(0);
    setXp(0);
    setStreak(0);
    setPicked(null);
    setUnlocked([]);
    setCorrect(0);
    setDone(false);
  };

  const shipClear = done && deck.length > 0 && correct >= Math.ceil(deck.length * 0.8);

  return (
    <ArcadeCabinet subtitle="Unlock memory crystals · earn XP · beat context traps" title="CONTEXT QUEST">
      <div className="context-quest-game">
        {!caseData || deck.length === 0 ? (
          <p className="context-quest-muted">Loading quests from Cognee memory…</p>
        ) : done ? (
          <div className="context-quest-end">
            <p className="context-quest-level font-sig text-2xl font-bold text-white">Level {level}</p>
            <p className="context-quest-xp-total">{xp} XP · best {Math.max(bestXp, xp)}</p>
            <p className={`context-quest-verdict ${shipClear ? 'clear' : 'block'}`}>
              {shipClear ? 'QUEST CLEAR — context memory is ship-ready' : 'QUEST FAILED — run the real MemGateQA audit'}
            </p>
            {unlocked.length > 0 ? (
              <div className="context-quest-crystals">
                <p className="context-quest-crystals-label">Memory crystals unlocked</p>
                <ul>
                  {unlocked.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="context-quest-actions">
              <button className="ent-btn ent-btn-primary ent-btn-sm" onClick={reset} type="button">
                Play again
              </button>
              <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseId}`}>
                Open belt audit →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="context-quest-hud">
              <span className="context-quest-hud-level">Lv {level}</span>
              <div className="context-quest-xp-bar" title={`${xpInLevel}/${XP_PER_LEVEL} XP to next level`}>
                <div className="context-quest-xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <span>Quest {round + 1}/{deck.length}</span>
              <span className={streak >= 2 ? 'hot' : ''}>Streak ×{streak}</span>
            </div>

            {unlocked.length > 0 ? (
              <div className="context-quest-map">
                {unlocked.map((c) => (
                  <span className="context-quest-crystal" key={c} title={c}>
                    ◆
                  </span>
                ))}
                {Array.from({ length: Math.max(0, ROUNDS - unlocked.length) }).map((_, i) => (
                  <span className="context-quest-crystal locked" key={`lock-${i}`}>
                    ◇
                  </span>
                ))}
              </div>
            ) : null}

            <p className="context-quest-kicker">{current.title}</p>
            <p className="context-quest-question">{current.question}</p>
            <p className="context-quest-prompt">Pick the recall() answer that keeps your context safe</p>
            <div className="context-quest-choices">
              {options.map((opt) => {
                const selected = picked === opt.id;
                const showResult = picked !== null;
                const state = showResult
                  ? opt.correct
                    ? 'win'
                    : selected
                      ? 'lose'
                      : 'idle'
                  : 'idle';
                return (
                  <button
                    key={opt.id}
                    className={`context-quest-choice ${state}`}
                    disabled={picked !== null}
                    onClick={() => pick(opt.id, opt.correct)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {picked ? (
              <p className="context-quest-hint">
                {options.find((o) => o.id === picked)?.correct
                  ? `+${Math.round(XP_PER_CORRECT * (1 + Math.min(streak - 1, 4) * 0.25))} XP — crystal unlocked`
                  : REPAIR_HINT[current.repairAction || 'improve'] ?? 'Wrong path — memory trap triggered'}
              </p>
            ) : null}
          </>
        )}
      </div>
    </ArcadeCabinet>
  );
}