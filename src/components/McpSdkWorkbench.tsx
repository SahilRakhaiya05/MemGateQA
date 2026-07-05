import { useEffect, useState } from 'react';
import { api, type IntegrationsSnapshot } from '../api/memgateqaApi';
import { createMemGateSdk } from '../sdk/memgateSdk';
import { useToast } from './Toast';

interface McpSdkWorkbenchProps {
  caseId?: string;
}

type ToolTest = {
  id: string;
  label: string;
  mcp: string;
  sdk: string;
  run: () => Promise<unknown>;
};

const AGENTS = [
  { id: 'cursor', name: 'Cursor', icon: '◈', hint: 'Project .mcp.json — restart MCP after bridge is up' },
  { id: 'claude', name: 'Claude Code', icon: '✳', hint: 'stdio memgateqa server' },
  { id: 'codex', name: 'Codex CLI', icon: '◇', hint: 'memgateqa_run_auto_agent · memgateqa_auto_audit' },
] as const;

export function McpSdkWorkbench({ caseId = 'case-wolfpack' }: McpSdkWorkbenchProps) {
  const { toast } = useToast();
  const [data, setData] = useState<IntegrationsSnapshot | null>(null);
  const [healthOk, setHealthOk] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [output, setOutput] = useState('');
  const [tab, setTab] = useState<'mcp' | 'sdk'>('mcp');

  useEffect(() => {
    api.integrations().then(setData).catch(() => setData(null));
    api.health().then((h) => setHealthOk(h.ok)).catch(() => setHealthOk(false));
  }, []);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied`, 'success');
  };

  const runTool = async (tool: ToolTest) => {
    setActiveTool(tool.id);
    setOutput('');
    try {
      const res = await tool.run();
      setOutput(JSON.stringify(res, null, 2));
      toast(`${tool.label} OK`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tool failed';
      setOutput(msg);
      toast(msg, 'error');
    } finally {
      setActiveTool(null);
    }
  };

  if (!data) return <div className="case-skeleton h-32" />;

  const sdk = createMemGateSdk(caseId);
  const mcpTools = data.mcp.memgateqa.tools;
  const llmLive =
    data.llm.provider === 'openai'
      ? data.llm.openai
      : data.llm.provider === 'gemini'
        ? (data.llm.geminiReachable ?? data.llm.gemini)
        : false;

  const toolTests: ToolTest[] = [
    {
      id: 'context',
      label: 'Context',
      mcp: 'context',
      sdk: 'sdk.context()',
      run: () => sdk.context(),
    },
    {
      id: 'recall',
      label: 'Recall',
      mcp: 'recall',
      sdk: 'sdk.recall(query)',
      run: () => sdk.recall('what traps failed', 'hybrid'),
    },
    {
      id: 'autoAudit',
      label: 'Auto audit',
      mcp: 'memgateqa_auto_audit',
      sdk: 'sdk.autoAudit()',
      run: () => sdk.autoAudit(),
    },
    {
      id: 'runAutoAgent',
      label: 'Auto agent',
      mcp: 'memgateqa_run_auto_agent',
      sdk: 'sdk.runAutoAgent()',
      run: () => sdk.runAutoAgent({ startAutoLoop: false }),
    },
    {
      id: 'fullLoop',
      label: 'Full loop',
      mcp: 'memgateqa_run_full_loop',
      sdk: 'sdk.runFullLoop()',
      run: () => sdk.runFullLoop(),
    },
    {
      id: 'loopStatus',
      label: 'Loop status',
      mcp: 'memgateqa_auto_loop',
      sdk: 'sdk.autoLoopStatus()',
      run: () => sdk.autoLoopStatus(),
    },
  ];

  const mcpConfig = `npm run mcp:config`;
  const sdkSnippet = `import { createMemGateSdk } from './sdk/memgateSdk';
const sdk = createMemGateSdk('${caseId}');
await sdk.runAutoAgent();  // memory → audit → repair → loop`;

  return (
    <section className="mcp-sdk-workbench">
      <div className="mcp-sdk-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">MCP · SDK workbench</p>
          <h3 className="font-sig text-lg font-bold text-white">Test tools live · Claude · Codex · Cursor</h3>
          <p className="mt-1 text-sm text-slate-400">
            Bridge {healthOk ? 'live' : 'offline'} · {mcpTools.length} MCP tools · case {caseId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => copy(mcpConfig, 'MCP config')} type="button">
            Copy MCP config
          </button>
          <button className="ent-btn ent-btn-primary ent-btn-sm" onClick={() => copy(sdkSnippet, 'SDK snippet')} type="button">
            Copy SDK
          </button>
        </div>
      </div>

      <div className="mcp-sdk-agents">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="mcp-sdk-agent-card">
            <span className="agent-fabric-icon">{agent.icon}</span>
            <div className="flex-1">
              <p className="font-sig font-bold text-white">{agent.name}</p>
              <p className="text-xs text-slate-500">{agent.hint}</p>
            </div>
          </div>
        ))}
        <div className="mcp-sdk-agent-card mcp-sdk-agent-llm">
          <span className="agent-fabric-icon">🧠</span>
          <div className="flex-1">
            <p className="font-sig font-bold text-white">
              {data.llm.provider} · {data.llm.model}
            </p>
            <p className="text-xs text-slate-500">
              {llmLive ? `${data.llm.geminiModels?.length ?? 0} models reachable` : 'Set LLM API key in Settings'}
            </p>
          </div>
          <span className={`integrations-dot ${llmLive ? 'live' : 'offline'}`} />
        </div>
      </div>

      <div className="mcp-sdk-tabs">
        <button className={`platform-tab ${tab === 'mcp' ? 'active' : ''}`} onClick={() => setTab('mcp')} type="button">
          MCP tools
        </button>
        <button className={`platform-tab ${tab === 'sdk' ? 'active' : ''}`} onClick={() => setTab('sdk')} type="button">
          SDK test
        </button>
      </div>

      {tab === 'mcp' ? (
        <div className="mcp-sdk-tools-grid">
          {mcpTools.map((t) => (
            <span key={t} className="integrations-loop-pill mcp-sdk-tool-pill">
              {t}
            </span>
          ))}
        </div>
      ) : (
        <div className="mcp-sdk-test-grid">
          {toolTests.map((tool) => (
            <button
              key={tool.id}
              className="mcp-sdk-test-btn"
              disabled={activeTool !== null}
              onClick={() => runTool(tool)}
              type="button"
            >
              <span className="mcp-sdk-test-label">{tool.label}</span>
              <span className="mcp-sdk-test-meta">{tool.mcp}</span>
              {activeTool === tool.id ? <span className="mcp-sdk-test-spin">…</span> : null}
            </button>
          ))}
        </div>
      )}

      {output ? (
        <pre className="mcp-sdk-output">{output}</pre>
      ) : (
        <pre className="agent-fabric-sdk">{sdkSnippet}</pre>
      )}
    </section>
  );
}