import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type IntegrationsSnapshot } from '../api/memgateqaApi';

interface AgentStatusBarProps {
  caseId?: string;
  compact?: boolean;
}

function llmLive(data: IntegrationsSnapshot): boolean {
  if (data.llm.provider === 'openai') return Boolean(data.llm.openai);
  if (data.llm.provider === 'gemini') return Boolean(data.llm.geminiReachable ?? data.llm.gemini);
  return false;
}

function llmKeyHint(data: IntegrationsSnapshot): string {
  if (data.llm.provider === 'openai') return 'Set OPENAI_API_KEY';
  if (data.llm.provider === 'gemini') return 'Set API key in Settings';
  return 'Configure LLM in Settings';
}

function providerLabel(provider: string): string {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'gemini') return 'Google AI';
  return provider || 'Not configured';
}

export function AgentStatusBar({ caseId, compact }: AgentStatusBarProps) {
  const [data, setData] = useState<IntegrationsSnapshot | null>(null);

  useEffect(() => {
    api.integrations().then(setData).catch(() => setData(null));
    const t = setInterval(() => {
      api.integrations().then(setData).catch(() => setData(null));
    }, 12000);
    return () => clearInterval(t);
  }, []);

  if (!data) return <div className="case-skeleton h-10" />;

  const live = llmLive(data);
  const hasKey = data.llm.openai || data.llm.gemini;
  const cogneeLive = data.cognee.reachable;
  const mcpTools = data.mcp.memgateqa.tools.length;
  const agentPath = caseId ? `/cases/${caseId}/agent` : '/cases/case-wolfpack/agent';
  const modelCount = data.llm.geminiModels?.length ?? 0;

  return (
    <div className={`agent-status-bar ${compact ? 'compact' : ''}`}>
      <div className="agent-status-bar-tiles">
        <div className="agent-status-bar-tile">
          <span className={`integrations-dot ${live ? 'live' : hasKey ? 'offline' : 'offline'}`} />
          <div>
            <p className="agent-status-bar-label">LLM</p>
            <p className="agent-status-bar-value">
              {live
                ? `${providerLabel(data.llm.provider)} · ${data.llm.model}${modelCount ? ` · ${modelCount} models` : ''}`
                : hasKey
                  ? 'Key set — checking…'
                  : llmKeyHint(data)}
            </p>
          </div>
        </div>
        <div className="agent-status-bar-tile">
          <span className={`integrations-dot ${cogneeLive ? 'live' : 'offline'}`} />
          <div>
            <p className="agent-status-bar-label">Cognee</p>
            <p className="agent-status-bar-value">{cogneeLive ? data.cognee.dataset : 'Not connected'}</p>
          </div>
        </div>
        <div className="agent-status-bar-tile">
          <span className={`integrations-dot ${mcpTools > 0 ? 'live' : 'offline'}`} />
          <div>
            <p className="agent-status-bar-label">MCP agent</p>
            <p className="agent-status-bar-value">{mcpTools} tools · {providerLabel(data.llm.provider)}</p>
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="agent-status-bar-links">
          <Link className="ent-btn ent-btn-secondary ent-btn-sm" to={agentPath}>
            Automation
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use AgentStatusBar */
export const GeminiAgentBar = AgentStatusBar;