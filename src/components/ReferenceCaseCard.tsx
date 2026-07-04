import { Link } from 'react-router-dom';
import type { CaseRecord } from '../api/memgateqaApi';

interface ReferenceCaseCardProps {
  reference: CaseRecord;
}

/** Entry point to the WolfPack reference audit — fleet dashboard stays separate. */
export function ReferenceCaseCard({ reference }: ReferenceCaseCardProps) {
  const score = reference.lastScore;
  const ready = (score ?? 0) >= 80;

  return (
    <section className="reference-case-card">
      <div className="reference-case-copy">
        <p className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">Reference audit</p>
        <h2 className="font-sig text-xl font-bold text-white">{reference.name}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Pre-loaded memory incident with evidence, trap tests, repair flow, and deploy certificate.
          Index evidence, run traps, approve repair, and export the memory health certificate.
        </p>
        <dl className="reference-case-stats">
          <div>
            <dt>Evidence</dt>
            <dd>{reference.evidence?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Trap tests</dt>
            <dd>{reference.tests?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd>{score != null ? `${score}%` : 'Pending'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{ready ? 'Ship clear' : score != null ? 'Needs repair' : reference.status}</dd>
          </div>
        </dl>
      </div>
      <div className="reference-case-actions">
        <Link className="ent-btn ent-btn-primary" to={`/cases/${reference.id}`}>
          Open audit
        </Link>
        <Link className="ent-btn ent-btn-secondary" to={`/cases/${reference.id}/tests`}>
          Run traps
        </Link>
      </div>
    </section>
  );
}