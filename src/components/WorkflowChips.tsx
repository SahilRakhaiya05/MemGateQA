interface WorkflowChipsProps {
  onRunAll?: () => void;
  onNavigate?: (tab: string) => void;
  disabled?: boolean;
}

const CHIPS = [
  { id: 'privacy', label: 'Privacy gate', action: 'tests' as const },
  { id: 'forget', label: 'Forget verify', action: 'tests' as const },
  { id: 'stale', label: 'Stale memory', action: 'tests' as const },
  { id: 'interrogate', label: 'Run all tests', action: 'run' as const },
];

export function WorkflowChips({ onRunAll, onNavigate, disabled }: WorkflowChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          className="workflow-chip rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 disabled:opacity-40"
          disabled={disabled && chip.action === 'run'}
          onClick={() => {
            if (chip.action === 'run') onRunAll?.();
            else onNavigate?.(chip.action);
          }}
          type="button"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}