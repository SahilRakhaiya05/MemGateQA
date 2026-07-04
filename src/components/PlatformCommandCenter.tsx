import { CogneeProductFlow } from './CogneeProductFlow';

interface PlatformCommandCenterProps {
  compact?: boolean;
}

export function PlatformCommandCenter({ compact }: PlatformCommandCenterProps) {
  return (
    <section className={`platform-command-center ${compact ? 'platform-command-compact' : ''}`}>
      <CogneeProductFlow compact={compact} />
    </section>
  );
}