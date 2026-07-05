import type { CaseRecord } from '../../api/memgateqaApi';
import { sortCasesForFloor } from '../../lib/demoCases';

interface CaseFloorPickerProps {
  cases: CaseRecord[];
  activeId: string;
  onChange: (caseId: string) => void;
}

/** Switch which agent runs on the live belt — every case gets the same floor UX. */
export function CaseFloorPicker({ cases, activeId, onChange }: CaseFloorPickerProps) {
  const sorted = sortCasesForFloor(cases);
  if (sorted.length === 0) return null;

  return (
    <div className="case-floor-picker" role="tablist" aria-label="Choose agent for Memory Studio">
      {sorted.map((c) => {
        const active = c.id === activeId;
        const score = c.lastScore;
        return (
          <button
            key={c.id}
            aria-selected={active}
            className={`case-floor-picker-item ${active ? 'active' : ''}`}
            onClick={() => onChange(c.id)}
            role="tab"
            type="button"
          >
            <span className="case-floor-picker-name">{c.agent || c.name}</span>
            <span className="case-floor-picker-meta">
              {c.evidence?.length ?? 0} facts · {c.tests?.length ?? 0} traps
              {score != null ? ` · ${score}%` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}