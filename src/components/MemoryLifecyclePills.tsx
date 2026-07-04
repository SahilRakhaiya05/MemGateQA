const OPS = [
  { key: 'remember', label: 'REMEMBER', fn: 'remember()', color: 'cyan' },
  { key: 'recall', label: 'RECALL', fn: 'recall()', color: 'blue' },
  { key: 'improve', label: 'IMPROVE', fn: 'improve()', color: 'purple' },
  { key: 'forget', label: 'FORGET', fn: 'forget()', color: 'red' },
] as const;

interface MemoryLifecyclePillsProps {
  active?: string[];
  lastOp?: string;
  compact?: boolean;
  fnStyle?: boolean;
  showHeading?: boolean;
  className?: string;
}

export function MemoryLifecyclePills({
  active = [],
  lastOp,
  compact = false,
  fnStyle = false,
  showHeading = true,
  className = '',
}: MemoryLifecyclePillsProps) {
  return (
    <div className={`lifecycle-wrap ${compact ? 'compact' : ''} ${className}`.trim()}>
      {showHeading ? (
        <span className="lifecycle-heading font-hud uppercase tracking-widest text-slate-500">
          {compact ? 'Lifecycle' : 'Cognee lifecycle'}
        </span>
      ) : null}
      <div className="lifecycle-pills">
        {OPS.map((op) => {
          const lit = active.includes(op.key) || lastOp === op.key;
          return (
            <span
              key={op.key}
              className={`lifecycle-pill lifecycle-pill-${op.color} ${lit ? 'lit' : ''} ${lastOp === op.key ? 'current' : ''}`}
              title={op.fn}
            >
              {fnStyle ? op.fn : op.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function statusToLifecycle(status: string): string[] {
  switch (status) {
    case 'open':
      return [];
    case 'intake':
      return ['remember'];
    case 'tested':
      return ['recall'];
    case 'surgery':
      return ['improve', 'forget'];
    case 'repaired':
      return ['recall', 'improve'];
    case 'closed':
      return ['remember', 'recall', 'improve', 'forget'];
    default:
      return [];
  }
}

/** Merge case status + current route + live belt into one active-op set. */
export function lifecycleForContext(
  status: string,
  pathname: string,
  opts?: { beltFast?: boolean; bridgeLive?: boolean },
): string[] {
  const set = new Set(statusToLifecycle(status));

  if (pathname.includes('/evidence')) set.add('remember');
  if (pathname.includes('/tests') || pathname.includes('/results')) set.add('recall');
  if (pathname.includes('/surgery')) {
    set.add('improve');
    set.add('forget');
  }
  if (pathname.includes('/report')) set.add('recall');

  if (opts?.beltFast) set.add('remember');

  if (set.size === 0 && opts?.bridgeLive) {
    return ['remember', 'recall', 'improve', 'forget'];
  }

  return [...set];
}

export function currentLifecycleOp(pathname: string, beltFast?: boolean): string | undefined {
  if (beltFast || pathname.includes('/evidence')) return 'remember';
  if (pathname.includes('/tests') || pathname.includes('/results')) return 'recall';
  if (pathname.includes('/surgery')) return 'improve';
  if (pathname.includes('/report')) return 'recall';
  return undefined;
}