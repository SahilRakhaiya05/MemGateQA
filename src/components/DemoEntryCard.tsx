import { Link } from 'react-router-dom';
import type { CaseRecord } from '../api/memgateqaApi';

interface DemoEntryCardProps {
  demo: CaseRecord;
}

/** Single entry point to the WolfPack sample audit — not a second arena preview. */
export function DemoEntryCard({ demo }: DemoEntryCardProps) {
  const score = demo.lastScore;
  const ready = (score ?? 0) >= 80;

  return (
    <section className="demo-entry-card">
      <div className="demo-entry-copy">
        <p className="font-hud text-[9px] uppercase tracking-widest text-theme-accent">Sample audit</p>
        <h2 className="font-sig text-xl font-bold text-white">{demo.name}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Pre-loaded memory incident with evidence, trap tests, repair flow, and deploy certificate.
          Open it to run the full QA pipeline in the sortation arena — the dashboard stays your fleet view.
        </p>
        <dl className="demo-entry-stats">
          <div>
            <dt>Evidence</dt>
            <dd>{demo.evidence?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Trap tests</dt>
            <dd>{demo.tests?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd>{score != null ? `${score}%` : 'Pending'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{ready ? 'Ship clear' : score != null ? 'Needs repair' : demo.status}</dd>
          </div>
        </dl>
      </div>
      <div className="demo-entry-actions">
        <Link className="ent-btn ent-btn-primary" to={`/cases/${demo.id}`}>
          Open demo arena
        </Link>
        <Link className="ent-btn ent-btn-secondary" to={`/cases/${demo.id}/tests`}>
          Run traps
        </Link>
      </div>
    </section>
  );
}