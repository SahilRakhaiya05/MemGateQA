import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord, type TestItem } from '../api/memgateqaApi';
import { ArcadeCabinet } from './arcade/ArcadeCabinet';

const ROUNDS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function choicesFor(test: TestItem): { id: string; label: string; correct: boolean }[] {
  const correct = (test.expected || '').slice(0, 120);
  const decoys = [
    test.trap || 'Supabase + 5 PM demo (stale memory)',
    'I am not sure — hallucinated details',
    'Old standup note overrides everything',
  ].filter((d) => d && d !== correct);
  const picks = shuffle(decoys).slice(0, 2);
  return shuffle([
    { id: 'ok', label: correct || 'Matches evidence', correct: true },
    { id: 'd1', label: picks[0] ?? 'Stale memory leak', correct: false },
    { id: 'd2', label: picks[1] ?? 'Unsupported claim', correct: false },
  ]);
}

export function MemoryTrapGame({ caseId = 'case-wolfpack' }: { caseId?: string }) {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const deck = useMemo(() => {
    if (!caseData?.tests?.length) return [];
    return shuffle(caseData.tests).slice(0, ROUNDS);
  }, [caseData]);

  const current = deck[round];
  const options = current ? choicesFor(current) : [];

  useEffect(() => {
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
    setRound(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setDone(false);
  }, [caseId]);

  const pick = (id: string, correct: boolean) => {
    if (picked || !current) return;
    setPicked(id);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      if (round + 1 >= deck.length) {
        setDone(true);
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, 900);
  };

  const reset = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setDone(false);
  };

  const pct = deck.length ? Math.round((score / deck.length) * 100) : 0;
  const shipClear = pct >= 80;

  return (
    <ArcadeCabinet subtitle="Trap runner — pick safe recall before deploy" title="MEMORY TRAP RUNNER">
      <div className="memory-trap-game">
        {!caseData || deck.length === 0 ? (
          <p className="memory-trap-game-muted">Loading recall traps…</p>
        ) : done ? (
          <div className="memory-trap-game-end">
            <p className="memory-trap-game-score font-sig text-3xl font-bold text-white">{pct}%</p>
            <p className={`memory-trap-game-verdict ${shipClear ? 'clear' : 'block'}`}>
              {shipClear ? 'SHIP CLEAR — you caught the traps' : 'SHIP BLOCKED — run the real audit'}
            </p>
            <p className="memory-trap-game-muted text-sm">
              You are the <strong className="text-slate-300">QA inspector</strong> — pick the answer that matches
              evidence before deploy.
            </p>
            <div className="memory-trap-game-actions">
              <button className="ent-btn ent-btn-primary ent-btn-sm" onClick={reset} type="button">
                Play again
              </button>
              <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseId}`}>
                Run real audit →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="memory-trap-game-hud">
              <span>
                Round {round + 1}/{deck.length}
              </span>
              <span>Score {score}</span>
              <span className={streak >= 2 ? 'hot' : ''}>Streak {streak}</span>
            </div>
            <p className="memory-trap-game-kicker">{current.title}</p>
            <p className="memory-trap-game-question">{current.question}</p>
            <p className="memory-trap-game-prompt">Which recall() answer is safe to ship?</p>
            <div className="memory-trap-game-choices">
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
                    className={`memory-trap-game-choice ${state}`}
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
              <p className="memory-trap-game-hint">
                {options.find((o) => o.id === picked)?.correct
                  ? '✓ Trap avoided — matches evidence'
                  : '✗ That answer would ship a memory bug'}
              </p>
            ) : null}
          </>
        )}
      </div>
    </ArcadeCabinet>
  );
}