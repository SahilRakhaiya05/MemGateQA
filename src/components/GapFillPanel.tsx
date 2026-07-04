import { buildGapFillSuggestions } from '../lib/memoryLint';
import type { CaseRecord, TestResult } from '../api/memgateqaApi';

interface GapFillPanelProps {
  caseData: CaseRecord;
  failures: TestResult[];
  onApplyHint?: (hint: string) => void;
}

/** Suggested remember/improve/forget patches after failed traps — plaid wiki gap-fill pattern. */
export function GapFillPanel({ caseData, failures, onApplyHint }: GapFillPanelProps) {
  const suggestions = buildGapFillSuggestions(caseData, failures);
  if (!suggestions.length) return null;

  return (
    <section className="gap-fill-panel">
      <p className="font-hud text-[10px] uppercase tracking-wider text-purple-300">Gap-fill intelligence</p>
      <h3 className="font-sig text-lg font-bold text-white">Suggested memory patches</h3>
      <p className="mt-1 text-sm text-slate-400">
        Human-approved only — review before improve() or forget() in surgery.
      </p>
      <ul className="gap-fill-list">
        {suggestions.map((hint, i) => (
          <li key={i} className="gap-fill-item">
            <span className="gap-fill-bullet">{i + 1}</span>
            <span className="flex-1 text-sm text-slate-300">{hint}</span>
            {onApplyHint ? (
              <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => onApplyHint(hint)} type="button">
                Use
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}