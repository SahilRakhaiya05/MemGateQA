import { useEffect, useState } from 'react';
import { api, type IntegrationsSnapshot } from '../api/memgateqaApi';
import { useToast } from './Toast';

const LINKS = [
  { id: 'mcp', label: 'MCP', icon: '◈', action: 'mcp' as const },
  { id: 'sdk', label: 'SDK', icon: '⬡', action: 'sdk' as const },
  { id: 'cli', label: 'CLI', icon: '⌘', action: 'cli' as const },
  { id: 'cognee', label: 'Cognee', icon: '☁', href: 'https://docs.cognee.ai/python-api' },
  { id: 'github', label: 'GitHub', icon: '⎇', href: 'https://github.com/SahilRakhaiya05/MemGateQA' },
];

export function HeaderIntegrations() {
  const { toast } = useToast();
  const [data, setData] = useState<IntegrationsSnapshot | null>(null);

  useEffect(() => {
    api.integrations().then(setData).catch(() => setData(null));
  }, []);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied`, 'success');
  };

  const onAction = (action: 'mcp' | 'sdk' | 'cli') => {
    if (action === 'mcp') {
      copy('npm run mcp:config', 'MCP config');
      return;
    }
    if (action === 'sdk') {
      copy(
        `import { createMemGateSdk } from './sdk/memgateSdk';\nconst sdk = createMemGateSdk('case-wolfpack');\nawait sdk.runAutoAgent();`,
        'SDK snippet',
      );
      return;
    }
    copy('npm run agent:run', 'CLI command');
  };

  const mcpLive = data?.mcp?.memgateqa?.tools?.length;

  return (
    <div className="header-integrations">
      {LINKS.map((link) =>
        link.href ? (
          <a
            key={link.id}
            className="header-int-link"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
            title={link.label}
          >
            <span>{link.icon}</span>
            <span className="hidden lg:inline">{link.label}</span>
          </a>
        ) : (
          <button
            key={link.id}
            className="header-int-link"
            onClick={() => link.action && onAction(link.action)}
            title={`Copy ${link.label}`}
            type="button"
          >
            <span>{link.icon}</span>
            <span className="hidden lg:inline">{link.label}</span>
          </button>
        ),
      )}
      {mcpLive ? (
        <span className="header-int-badge" title={`${mcpLive} MCP tools`}>
          {mcpLive} tools
        </span>
      ) : null}
    </div>
  );
}