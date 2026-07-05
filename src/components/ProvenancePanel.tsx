import { useEffect, useState } from 'react';
import { api } from '../api/memgateqaApi';

interface ProvenancePanelProps {
  caseId: string;
}

export function ProvenancePanel({ caseId }: ProvenancePanelProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getSchemaProvenance(caseId, true).then(setData).catch(() => setData(null));
  }, [caseId]);

  const chain = (data?.chain as { role?: string; label?: string }[] | undefined) ?? [];
  const nodes = (data?.nodes as { label?: string; type?: string }[] | undefined) ?? [];

  return (
    <section className="ent-card p-4">
      <p className="font-hud text-[10px] uppercase tracking-wider text-violet-300">Chain of custody</p>
      <h3 className="font-sig text-lg font-bold text-white">schema/provenance</h3>
      <p className="mt-1 text-sm text-slate-400">
        Tenant → user → agent → dataset ownership — proof that memory is traceable.
      </p>
      {chain.length ? (
        <ol className="mt-4 space-y-2">
          {chain.map((item, i) => (
            <li key={`${item.role}-${i}`} className="flex items-center gap-2 text-sm text-slate-200">
              <span className="font-hud text-[10px] uppercase text-violet-300">{item.role}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
      ) : nodes.length ? (
        <ul className="mt-4 space-y-1 text-sm text-slate-300">
          {nodes.slice(0, 8).map((n, i) => (
            <li key={i}>
              {n.type ? `${n.type}: ` : ''}
              {n.label ?? '—'}
            </li>
          ))}
        </ul>
      ) : (
        <pre className="mt-4 max-h-48 overflow-auto rounded bg-black/30 p-3 text-xs text-slate-400">
          {data ? JSON.stringify(data, null, 2) : 'Provenance unavailable until Cognee Cloud is connected.'}
        </pre>
      )}
    </section>
  );
}