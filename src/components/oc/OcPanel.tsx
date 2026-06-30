import type { ReactNode } from 'react';

interface OcPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  accent?: 'orange' | 'cyan' | 'gold';
}

export function OcPanel({ title, children, className = '', accent = 'orange' }: OcPanelProps) {
  return (
    <div className={`oc-panel oc-panel-${accent} ${className}`}>
      {title ? (
        <div className="oc-panel-header">
          <h2 className="oc-panel-title">{title}</h2>
        </div>
      ) : null}
      <div className="oc-panel-body">{children}</div>
    </div>
  );
}