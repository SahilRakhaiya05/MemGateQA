import { useState } from 'react';
import { OcButton } from './oc/OcButton';
import { OcPanel } from './oc/OcPanel';

interface Failure {
  testId: string;
  reason: string;
}

interface SurgeryStationProps {
  failures: Failure[];
  forgetIds: string[];
  instruction: string;
  onInstructionChange: (v: string) => void;
  busy: boolean;
  onApprove: () => void;
  message?: string;
}

const STEPS = ['Review', 'Approve', 'Surgery', 'Rerun'];

export function SurgeryStation({
  failures,
  forgetIds,
  instruction,
  onInstructionChange,
  busy,
  onApprove,
  message,
}: SurgeryStationProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="surgery-station">
      <div className="surgery-steps-bar">
        {STEPS.map((label, i) => (
          <div key={label} className={`surgery-step-pill ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="surgery-step-num">{i + 1}</span>
            <span className="surgery-step-label">{label}</span>
          </div>
        ))}
      </div>

      <OcPanel accent="cyan" title="Memory surgery station">
        {step === 0 ? (
          <>
            <p className="text-sm text-slate-300">
              {failures.length
                ? `${failures.length} gate failures require human-approved repair.`
                : 'Optional enrichment — no blocking failures.'}
            </p>
            {failures.length ? (
              <ul className="mt-4 space-y-2">
                {failures.map((f) => (
                  <li key={f.testId} className="surgery-fail-item">
                    <span className="text-red-400">✕</span> {f.reason}
                  </li>
                ))}
              </ul>
            ) : null}
            <OcButton className="mt-4" onClick={() => setStep(1)} variant="primary">
              Continue →
            </OcButton>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <label className="font-hud text-[10px] uppercase text-slate-500">improve() instruction</label>
            <textarea
              className="ent-input mt-2"
              onChange={(e) => onInstructionChange(e.target.value)}
              rows={4}
              value={instruction}
            />
            {forgetIds.length ? (
              <p className="mt-2 font-hud text-[10px] text-amber-300">forget() targets: {forgetIds.join(', ')}</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <OcButton
                disabled={busy}
                onClick={() => {
                  setStep(2);
                  onApprove();
                }}
                variant="primary"
              >
                {busy ? 'Applying…' : 'Approve & execute surgery'}
              </OcButton>
              <OcButton onClick={() => setStep(0)} variant="ghost">
                Back
              </OcButton>
            </div>
          </>
        ) : null}

        {step >= 2 ? (
          <div className="surgery-ops-log">
            <div className={`surgery-op ${busy ? 'running' : 'done'}`}>
              <span>improve()</span><span>{busy ? '…' : '✓'}</span>
            </div>
            {forgetIds.length ? (
              <div className={`surgery-op ${busy ? 'running' : 'done'}`}>
                <span>forget()</span><span>{busy ? '…' : '✓'}</span>
              </div>
            ) : null}
            <div className={`surgery-op ${busy ? 'running' : message ? 'done' : ''}`}>
              <span>recall() regression</span><span>{busy ? '…' : message ? '✓' : '—'}</span>
            </div>
            {message ? <p className="mt-4 font-hud text-sm text-emerald-300">{message}</p> : null}
          </div>
        ) : null}
      </OcPanel>
    </div>
  );
}