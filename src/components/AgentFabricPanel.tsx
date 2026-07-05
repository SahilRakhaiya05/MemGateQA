import { useEffect, useState } from 'react';
import { api, type IntegrationsSnapshot } from '../api/memgateqaApi';
import { useToast } from './Toast';

const AGENTS = [
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '◈',
    hint: 'Project .mcp.json — restart MCP after bridge is up',
    config: () => `npm run mcp:config`,
  },
  {
    id: 'claude',
    name: 'Claude Code',
    icon: '✳',
    hint: 'Add memgateqa stdio server to Claude MCP settings',
    config: () => `npm run mcp:config`,
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    icon: '◇',
    hint: 'memgateqa_auto_audit · memgateqa_run_full_loop tools',
    config: () => `npm run cli -- loop auto start case-wolfpack`,
  },
] as const;

export function AgentFabricPanel() {
  const { toast } = useToast();
  const [data, setData] = useState<IntegrationsSnapshot | null>(null);
  const [healthOk, setHealthOk] = useState(false);

  useEffect(() => {
    api.integrations().then(setData).catch(() => setData(null));
    api.health().then((h) => setHealthOk(h.ok)).catch(() => setHealthOk(false));
  }, []);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied`, 'success');
  };

  if (!data) return <div className="case-skeleton h-28" />;

  const mcpTools = data.mcp.memgateqa.tools;
  const llmLive =
    data.llm.provider === 'openai'
      ? data.llm.openai
      : data.llm.provider === 'gemini'
        ? (data.llm.geminiReachable ?? data.llm.gemini)
        : false;

  return (
    <section className="agent-fabric-panel">
      <div className="agent-fabric-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Agent fabric</p>
          <h3 className="font-sig text-lg font-bold text-white">MCP · SDK · Claude · Codex · Cursor</h3>
          <p className="mt-1 text-sm text-slate-400">
            Bridge {healthOk ? 'live' : 'offline'} · {mcpTools.length} MCP tools · auto-audit on new memory
          </p>
        </div>
        <button
          className="ent-btn ent-btn-primary ent-btn-sm"
          onClick={() => copy('npm run mcp:config', 'MCP config command')}
          type="button"
        >
          Copy MCP setup
        </button>
      </div>

      <div className="agent-fabric-grid">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="agent-fabric-card">
            <span className="agent-fabric-icon">{agent.icon}</span>
            <div className="flex-1">
              <p className="font-sig font-bold text-white">{agent.name}</p>
              <p className="text-xs text-slate-500">{agent.hint}</p>
            </div>
            <button
              className="ent-btn ent-btn-ghost ent-btn-sm"
              onClick={() => copy(agent.config(), `${agent.name} command`)}
              type="button"
            >
              Copy
            </button>
          </div>
        ))}
        <div className="agent-fabric-card agent-fabric-card-llm">
          <span className="agent-fabric-icon">🧠</span>
          <div className="flex-1">
            <p className="font-sig font-bold text-white">
              {data.llm.provider} · {data.llm.model}
            </p>
            <p className="text-xs text-slate-500">
              {llmLive
                ? `${data.llm.geminiModels?.length ?? 0} models reachable`
                : 'Set LLM API key in Settings'}
            </p>
          </div>
          <span className={`integrations-dot ${llmLive ? 'live' : 'offline'}`} />
        </div>
      </div>

      <div className="agent-fabric-tools">
        <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">MCP tools (auto audit memory)</p>
        <div className="integrations-loop-steps">
          {mcpTools.map((t) => (
            <span key={t} className="integrations-loop-pill">
              {t}
            </span>
          ))}
        </div>
      </div>

      <pre className="agent-fabric-sdk">{`import { createMemGateSdk } from './sdk/memgateSdk';
const sdk = createMemGateSdk('case-wolfpack');
await sdk.autoAudit();  // INDEX → traps → loop`}</pre>
    </section>
  );
}