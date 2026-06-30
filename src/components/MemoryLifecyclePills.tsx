const OPS = [
  { key: 'remember', label: 'REMEMBER', color: 'cyan' },
  { key: 'recall', label: 'RECALL', color: 'blue' },
  { key: 'improve', label: 'IMPROVE', color: 'purple' },
  { key: 'forget', label: 'FORGET', color: 'red' },
] as const;

interface MemoryLifecyclePillsProps {
  active?: string[];
  lastOp?: string;
}

export function MemoryLifecyclePills({ active = [], lastOp }: MemoryLifecyclePillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-hud text-[10px] uppercase tracking-widest text-slate-500">Cognee lifecycle</span>
      {OPS.map((op) => {
        const lit = active.includes(op.key) || lastOp === op.key;
        return (
          <span
            key={op.key}
            className={`lifecycle-pill lifecycle-pill-${op.color} ${lit ? 'lit' : ''}`}
          >
            {op.label}
          </span>
        );
      })}
    </div>
  );
}

export function statusToLifecycle(status: string): string[] {
  switch (status) {
    case 'open':
      return [];
    case 'intake':
      return ['remember', 'improve'];
    case 'tested':
      return ['recall'];
    case 'surgery':
      return ['forget', 'improve'];
    case 'repaired':
      return ['recall'];
    case 'closed':
      return ['remember', 'recall', 'improve', 'forget'];
    default:
      return [];
  }
}