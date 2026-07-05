import { Link } from 'react-router-dom';
import { CASE_STATIONS } from './caseStations';
import { STUDIO } from '../../copy/brand';

interface StudioPipelineStripProps {
  caseId: string;
}

/** A–Z case workflow — every station one click from Memory Studio. */
export function StudioPipelineStrip({ caseId }: StudioPipelineStripProps) {
  const base = `/cases/${caseId}`;

  return (
    <section className="studio-pipeline-strip">
      <header className="studio-pipeline-head">
        <p className="font-hud text-[10px] uppercase tracking-[0.2em] text-cyan-300">{STUDIO.pipeline}</p>
        <p className="text-sm text-slate-500">{STUDIO.pipelineSub}</p>
      </header>
      <nav aria-label="Case workflow stations" className="studio-pipeline-nav">
        {CASE_STATIONS.map((station, idx) => {
          const href = station.path ? `${base}/${station.path}` : base;
          return (
            <Link key={station.id} className="studio-pipeline-item" preventScrollReset title={station.subtitle} to={href}>
              <span className="studio-pipeline-step">{idx + 1}</span>
              <span className="studio-pipeline-icon">{station.icon}</span>
              <span className="studio-pipeline-label">{station.label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}