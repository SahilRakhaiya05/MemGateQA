import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArcadeMotionCard } from '../arcade/ArcadeMotionCard';
import { type CaseStationId, stationById } from './caseStations';

interface CasePageShellProps {
  station: CaseStationId;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function CasePageShell({ station, children, actions, footer }: CasePageShellProps) {
  const def = stationById(station);

  return (
    <div className="case-page-shell space-y-5">
      <ArcadeMotionCard className="case-station-header" delay={0}>
        <div className="case-station-header-inner">
          <div className="case-station-icon-wrap">{def.icon}</div>
          <div className="case-station-copy">
            <p className="case-station-kicker font-hud text-[9px] uppercase tracking-widest text-slate-500">
              Station {def.pipelineStep + 1} · {def.label}
            </p>
            <h1 className="font-sig text-xl font-bold text-white">{def.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{def.subtitle}</p>
          </div>
          {def.cogneeOp ? (
            <code className="case-station-op-pill">{def.cogneeOp}()</code>
          ) : null}
        </div>
        {actions ? <div className="case-station-actions">{actions}</div> : null}
      </ArcadeMotionCard>

      <div className="case-page-body">{children}</div>

      {footer ? <div className="case-page-footer">{footer}</div> : null}
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