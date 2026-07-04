import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { path: '/cases/case-wolfpack', tab: '', label: 'Overview', hint: 'WolfPack incident dossier — stale decisions, private leaks, failed forget.' },
  { path: '/cases/case-wolfpack/evidence', tab: 'evidence', label: 'Evidence', hint: 'Push approved docs through remember() on the factory conveyor.' },
  { path: '/cases/case-wolfpack/tests', tab: 'tests', label: 'Tests', hint: 'Run trap interrogation — 6 failure modes against live recall().' },
  { path: '/cases/case-wolfpack/results', tab: 'results', label: 'Results', hint: 'Suspect wall shows failures. Compare RAG vs Graph per test.' },
  { path: '/cases/case-wolfpack/surgery', tab: 'surgery', label: 'Repair', hint: 'Human-approved improve + forget — then rerun the suite.' },
  { path: '/cases/case-wolfpack/report', tab: 'report', label: 'Proof', hint: 'Export Memory Health Certificate with full score progression.' },
] as const;

const STORAGE_KEY = 'memgateqa-guided-tour-dismissed';

interface GuidedTourProps {
  compact?: boolean;
}

export function GuidedTour({ compact }: GuidedTourProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!compact && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [compact]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }, []);

  const goToStep = (idx: number) => {
    const s = STEPS[idx];
    setStep(idx);
    navigate(s.path);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      dismiss();
      return;
    }
    goToStep(step + 1);
  };

  if (compact) {
    return (
      <button className="ent-btn ent-btn-secondary ent-btn-sm" onClick={() => { setStep(0); setOpen(true); }} type="button">
        ▶ Guided walkthrough
      </button>
    );
  }

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div className="guided-tour-overlay">
      <div className="guided-tour-card">
        <div className="guided-tour-progress">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              className={`guided-tour-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => goToStep(i)}
              title={s.label}
              type="button"
            />
          ))}
        </div>
        <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">
          WolfPack walkthrough · Step {step + 1}/{STEPS.length}
        </p>
        <h3 className="font-sig text-xl font-bold text-white">{current.label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{current.hint}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="ent-btn ent-btn-primary" onClick={next} type="button">
            {step >= STEPS.length - 1 ? 'Finish' : 'Next station →'}
          </button>
          <button className="ent-btn ent-btn-ghost" onClick={dismiss} type="button">
            Skip
          </button>
        </div>
        <p className="mt-3 font-hud text-[9px] text-slate-500">Press ` for Cognee API receipts anytime</p>
      </div>
    </div>
  );
}