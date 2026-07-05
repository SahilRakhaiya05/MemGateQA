import { useEffect, useState } from 'react';
import { api } from '../api/memgateqaApi';

interface SchemaInventoryStripProps {
  caseId: string;
}

export function SchemaInventoryStrip({ caseId }: SchemaInventoryStripProps) {
  const [stats, setStats] = useState<string>('Loading graph stats…');

  useEffect(() => {
    api
      .getSchemaInventory(caseId)
      .then((inv) => {
        const types = inv.types ?? [];
        const total = inv.total_entities ?? types.reduce((s, t) => s + (t.count ?? 0), 0);
        const typeSummary = types
          .slice(0, 4)
          .map((t) => `${t.count ?? 0} ${t.type}`)
          .join(' · ');
        setStats(
          typeSummary
            ? `${total} entities · ${types.length} types · ${typeSummary}`
            : `${total} indexed evidence items`,
        );
      })
      .catch(() => setStats('Run remember() to populate schema inventory'));
  }, [caseId]);

  return (
    <div className="schema-inventory-strip rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-2">
      <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Schema inventory</p>
      <p className="text-sm text-slate-200">{stats}</p>
    </div>
  );
}