import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CasePageShellProps {
  children: ReactNode;
  actions?: ReactNode;
}

/** Page content wrapper — arena + tabs own navigation; no duplicate station header. */
export function CasePageShell({ children, actions }: CasePageShellProps) {
  return (
    <div className="case-page-shell space-y-5">
      {actions ? <div className="case-page-actions">{actions}</div> : null}
      {children}
    </div>
  );
}

interface CaseNextStepProps {
  label: string;
  hint: string;
  to: string;
}

export function CaseNextStep({ label, hint, to }: CaseNextStepProps) {
  return (
    <Link className="case-next-step" to={to}>
      <span className="case-next-step-label font-hud text-[9px] uppercase tracking-wider text-slate-500">
        Next step
      </span>
      <span className="case-next-step-title">{label}</span>
      <span className="case-next-step-hint">{hint}</span>
      <span className="case-next-step-arrow">→</span>
    </Link>
  );
}