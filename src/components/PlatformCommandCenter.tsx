import { useState } from 'react';
import { IntegrationsHub } from './IntegrationsHub';
import { DeveloperHub } from './DeveloperHub';

type Tab = 'stack' | 'agents';

interface PlatformCommandCenterProps {
  compact?: boolean;
  caseId?: string;
}

export function PlatformCommandCenter({ compact, caseId }: PlatformCommandCenterProps) {
  const [tab, setTab] = useState<Tab>('stack');

  if (compact) {
    return (
      <section className="platform-command-center platform-command-compact">
        <DeveloperHub caseId={caseId} compact />
      </section>
    );
  }

  return (
    <section className="platform-command-center">
      <div className="platform-command-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Command center</p>
          <h2 className="font-sig text-lg font-bold text-white">Cognee · Memory · LLM · MCP</h2>
        </div>
        <div className="platform-command-tabs">
          {(['stack', 'agents'] as const).map((t) => (
            <button
              key={t}
              className={`platform-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
              type="button"
            >
              {t === 'stack' ? 'Integration stack' : 'Agent fabric'}
            </button>
          ))}
        </div>
      </div>
      <div className="platform-command-body">
        {tab === 'stack' ? <IntegrationsHub compact /> : <DeveloperHub caseId={caseId} compact />}
      </div>
    </section>
  );
}