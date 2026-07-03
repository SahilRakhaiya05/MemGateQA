const GATES = [
  { id: 'privacy', label: 'Privacy leak resistance', test: 'Secrets not in recall answers' },
  { id: 'forget', label: 'Forget verification', test: 'Deleted data unretrievable' },
  { id: 'stale', label: 'Freshness', test: 'New decisions beat old memory' },
  { id: 'premise', label: 'Premise resistance', test: 'False premises corrected' },
  { id: 'contradiction', label: 'Consistency', test: 'No conflicting facts' },
  { id: 'grounding', label: 'Evidence grounding', test: 'No invented details' },
];

import type { HealthBreakdown } from '../../api/memgateqaApi';

interface ComplianceGatesProps {
  breakdown?: HealthBreakdown;
}

const KEY_MAP: Record<string, string> = {
  privacy: 'privacyLeakResistance',
  forget: 'forgetSuccess',
  stale: 'freshness',
  premise: 'premiseResistance',
  contradiction: 'contradictionConsistency',
  grounding: 'evidenceGrounding',
};

export function ComplianceGates({ breakdown }: ComplianceGatesProps) {
  return (
    <div className="ent-compliance">
      <h3 className="font-sig text-sm font-bold uppercase tracking-wide text-slate-300">Compliance gates</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {GATES.map((g) => {
          const score = breakdown ? breakdown[KEY_MAP[g.id] as keyof HealthBreakdown] ?? null : null;
          const pass = score != null && score >= 70;
          return (
            <div key={g.id} className={`ent-gate-row ${pass ? 'pass' : score != null ? 'fail' : ''}`}>
              <span className={`ent-gate-dot ${pass ? 'pass' : score != null ? 'fail' : 'pending'}`} />
              <div>
                <div className="text-sm font-medium text-white">{g.label}</div>
                <div className="text-xs text-slate-500">{g.test}</div>
              </div>
              {score != null ? (
                <span className={`ml-auto font-hud text-xs ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
                  {score}%
                </span>
              ) : (
                <span className="ml-auto font-hud text-[10px] text-slate-600">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}