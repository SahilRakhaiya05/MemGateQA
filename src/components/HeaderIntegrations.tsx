import { useEffect, useState } from 'react';
import { api } from '../api/memgateqaApi';

const EXTERNAL = [
  { id: 'cognee', label: 'Cognee docs', icon: '☁', href: 'https://docs.cognee.ai/python-api' },
  { id: 'github', label: 'GitHub', icon: '⎇', href: 'https://github.com/SahilRakhaiya05/MemGateQA' },
];

export function HeaderIntegrations() {
  const [toolCount, setToolCount] = useState<number | null>(null);

  useEffect(() => {
    api.developerManifest().then((m) => setToolCount(m.mcp.toolCount)).catch(() => setToolCount(null));
  }, []);

  return (
    <div className="header-integrations">
      {toolCount != null ? (
        <span className="header-int-link header-int-link-primary" title="MCP tools via bridge API">
          <span>◈</span>
          <span className="hidden lg:inline">MCP</span>
          <span className="header-int-badge">{toolCount} tools</span>
        </span>
      ) : null}
      {EXTERNAL.map((link) => (
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
      ))}
    </div>
  );
}