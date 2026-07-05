import { BEAM_CATEGORY_LABELS } from '../lib/beamCategories';

const TRAPS = [
  {
    id: 'stale',
    icon: '🕐',
    label: BEAM_CATEGORY_LABELS.stale,
    desc: 'Outdated facts still recalled after newer decisions (BEAM: Knowledge Update)',
    severity: 'high',
  },
  {
    id: 'contradiction',
    icon: '⚡',
    label: BEAM_CATEGORY_LABELS.contradiction,
    desc: 'Time-conflicting answers — routed via recall(TEMPORAL)',
    severity: 'critical',
  },
  {
    id: 'unsupported',
    icon: '❓',
    label: BEAM_CATEGORY_LABELS.unsupported,
    desc: 'Must cite evidence or abstain — no confabulation (BEAM: Abstention)',
    severity: 'medium',
  },
  {
    id: 'privacy',
    icon: '🔒',
    label: BEAM_CATEGORY_LABELS.privacy,
    desc: 'Private tokens or PII leaked — NodeSet-scoped recall (MemGateQA extension)',
    severity: 'critical',
  },
  {
    id: 'forget',
    icon: '🗑️',
    label: BEAM_CATEGORY_LABELS.forget,
    desc: 'Data marked for deletion still retrievable — verified forget() (extension)',
    severity: 'high',
  },
  {
    id: 'premise',
    icon: '🪤',
    label: BEAM_CATEGORY_LABELS.premise,
    desc: 'Falls for false premises — BEAM: Contradiction Resolution',
    severity: 'medium',
  },
] as const;

interface TrapCategoryGuideProps {
  activeCount?: Record<string, number>;
}

export function TrapCategoryGuide({ activeCount }: TrapCategoryGuideProps) {
  return (
    <div className="trap-guide">
      <div className="mb-4">
        <p className="font-hud text-[10px] uppercase tracking-wider text-orange-300">Trap taxonomy</p>
        <h3 className="font-sig text-lg font-bold text-white">Six memory failure modes</h3>
        <p className="mt-1 text-sm text-slate-400">
          Each trap test targets a specific class of agent memory failure. Mix categories for full coverage.
        </p>
      </div>
      <div className="trap-guide-grid">
        {TRAPS.map((t) => {
          const count = activeCount?.[t.id] ?? 0;
          return (
            <div key={t.id} className={`trap-guide-card trap-${t.id}`}>
              <div className="trap-guide-head">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <span className="font-sig text-sm font-bold text-white">{t.label}</span>
                  {count > 0 ? (
                    <span className="ml-2 rounded-full bg-cyan-400/15 px-2 py-0.5 font-hud text-[9px] text-cyan-300">
                      {count} active
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.desc}</p>
              <span className={`trap-guide-sev sev-${t.severity}`}>{t.severity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}