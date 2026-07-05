import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord, type EvidenceItem, type TestItem } from '../api/memgateqaApi';
import { readSession, writeSession } from '../lib/safeStorage';
import { ArcadeCabinet } from './arcade/ArcadeCabinet';

const ROUNDS = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function puzzleTests(tests: TestItem[]): TestItem[] {
  const linked = tests.filter((t) => (t.evidenceIds?.length ?? 0) >= 2 && (t.weight ?? 0) > 0);
  const pool = linked.length ? linked : tests.filter((t) => (t.evidenceIds?.length ?? 0) >= 1);
  return shuffle(pool).slice(0, ROUNDS);
}

function decoyEvidence(all: EvidenceItem[], keepIds: string[], count = 2): EvidenceItem[] {
  const keep = new Set(keepIds);
  return shuffle(all.filter((e) => !keep.has(e.id))).slice(0, count);
}

function bestKey(caseId: string) {
  return `connect-dots-best-${caseId}`;
}

export function ConnectDotsGame({ caseId = 'case-atlas-research' }: { caseId?: string }) {
  const [caseData, setCaseData] = useState<CaseRecord | null>(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'ok' | 'miss'>('idle');
  const [best, setBest] = useState(0);

  const deck = useMemo(() => (caseData?.tests ? puzzleTests(caseData.tests) : []), [caseData]);
  const evidenceById = useMemo(() => {
    const map = new Map<string, EvidenceItem>();
    (caseData?.evidence ?? []).forEach((e) => map.set(e.id, e));
    return map;
  }, [caseData]);

  const current = deck[round];
  const required = new Set(current?.evidenceIds ?? []);
  const board = useMemo(() => {
    if (!current) return [];
    const core = (current.evidenceIds ?? []).map((id) => evidenceById.get(id)).filter(Boolean) as EvidenceItem[];
    const extras = decoyEvidence(caseData?.evidence ?? [], current.evidenceIds ?? [], 2);
    return shuffle([...core, ...extras]);
  }, [caseData, current, evidenceById]);

  useEffect(() => {
    api.getCase(caseId).then(setCaseData).catch(() => setCaseData(null));
    setRound(0);
    setSelected(new Set());
    setScore(0);
    setStreak(0);
    setDone(false);
    setFeedback('idle');
    const saved = readSession(bestKey(caseId));
    setBest(saved ? Number(saved) || 0 : 0);
  }, [caseId]);

  const toggle = (id: string) => {
    if (feedback !== 'idle') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!current || feedback !== 'idle') return;
    const picked = selected;
    const correct =
      required.size > 0 &&
      picked.size === required.size &&
      [...required].every((id) => picked.has(id));
    setFeedback(correct ? 'ok' : 'miss');
    if (correct) {
      const bonus = 1 + Math.min(streak, 3) * 0.2;
      const gain = Math.round(100 * bonus);
      setScore((s) => s + gain);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      if (round + 1 >= deck.length) {
        setDone(true);
        setScore((final) => {
          if (final > best) {
            writeSession(bestKey(caseId), String(final));
            setBest(final);
          }
          return final;
        });
      } else {
        setRound((r) => r + 1);
        setSelected(new Set());
        setFeedback('idle');
      }
    }, 1100);
  };

  const reset = () => {
    setRound(0);
    setSelected(new Set());
    setScore(0);
    setStreak(0);
    setDone(false);
    setFeedback('idle');
  };

  if (!caseData) return <div className="case-skeleton h-48" />;

  if (!deck.length) {
    return (
      <p className="text-sm text-slate-400">
        Add multi-evidence traps to play inference linking.
      </p>
    );
  }

  if (done) {
    return (
      <ArcadeCabinet title="Connect the dots" subtitle="Inference links scored">
        <div className="connect-dots-done">
          <p className="connect-dots-score">{score} pts</p>
          <p className="text-sm text-slate-400">
            Best: {Math.max(best, score)} · Linked {deck.length} inference puzzles
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="ent-btn ent-btn-primary ent-btn-sm" onClick={reset} type="button">
              Play again
            </button>
            <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={`/cases/${caseId}/graph`}>
              Open memory map
            </Link>
          </div>
        </div>
      </ArcadeCabinet>
    );
  }

  return (
    <ArcadeCabinet
      title="Connect the dots"
      subtitle={`Round ${round + 1}/${deck.length} · ${score} pts · streak ${streak}`}
    >
      <div className="connect-dots-game">
        <p className="connect-dots-question">{current?.question}</p>
        <p className="connect-dots-hint">
          Select every evidence node that supports the grounded answer — then submit.
        </p>
        <div className="connect-dots-board">
          {board.map((ev) => {
            const on = selected.has(ev.id);
            const showOk = feedback !== 'idle' && required.has(ev.id);
            const showBad = feedback === 'miss' && on && !required.has(ev.id);
            return (
              <button
                key={ev.id}
                className={`connect-dots-node ${on ? 'selected' : ''} ${showOk ? 'correct' : ''} ${showBad ? 'wrong' : ''}`}
                onClick={() => toggle(ev.id)}
                type="button"
              >
                <span className="connect-dots-node-kind">{ev.kind}</span>
                <span className="connect-dots-node-title">{ev.title}</span>
              </button>
            );
          })}
        </div>
        {feedback === 'ok' ? <p className="connect-dots-feedback ok">Inference link confirmed</p> : null}
        {feedback === 'miss' ? (
          <p className="connect-dots-feedback miss">
            Miss — need {required.size} supporting nodes. Try memify() in surgery.
          </p>
        ) : null}
        <button
          className="ent-btn ent-btn-primary ent-btn-sm mt-3"
          disabled={selected.size === 0 || feedback !== 'idle'}
          onClick={submit}
          type="button"
        >
          Lock inference link
        </button>
      </div>
    </ArcadeCabinet>
  );
}