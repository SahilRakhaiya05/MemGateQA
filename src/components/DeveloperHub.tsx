import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type DeveloperManifest, type DeveloperMcpTool } from '../api/memgateqaApi';
import { createMemGateSdk } from '../sdk/memgateSdk';
import { useToast } from './Toast';

type Tab = 'overview' | 'mcp' | 'cli' | 'sdk' | 'setup';

interface DeveloperHubProps {
  caseId?: string;
  compact?: boolean;
}

async function runMcpViaSdk(tool: DeveloperMcpTool, caseId: string) {
  const sdk = createMemGateSdk(caseId);
  const n = tool.name;
  if (n === 'memory') return sdk.memory('MCP test fact from Developer Hub', 'sdk');
  if (n === 'recall') return sdk.recall('What database are we using?', 'hybrid');
  if (n === 'context') return sdk.context();
  if (n === 'memgateqa_remember') return sdk.remember();
  if (n === 'memgateqa_interrogate') return sdk.interrogate();
  if (n === 'memgateqa_auto_audit') return sdk.autoAudit();
  if (n === 'memgateqa_run_auto_agent') return sdk.runAutoAgent({ startAutoLoop: false, applyRepair: false });
  if (n === 'memgateqa_run_full_loop') return sdk.runFullLoop();
  if (n === 'memgateqa_auto_loop') return sdk.autoLoopStatus();
  if (n === 'memgateqa_loop_tick') return sdk.loopTick('observe');
  if (n === 'memgateqa_list_cases') return sdk.listCases();
  if (n === 'memgateqa_get_case') return sdk.getCase();
  if (n === 'memgateqa_agent_chat') return sdk.agentChat('Summarize memory health in one sentence');
  throw new Error(`No SDK runner for ${n}`);
}

export function DeveloperHub({ caseId = 'case-wolfpack', compact }: DeveloperHubProps) {
  const { toast } = useToast();
  const [manifest, setManifest] = useState<DeveloperManifest | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [output, setOutput] = useState('');

  useEffect(() => {
    api.developerManifest().then(setManifest).catch(() => setManifest(null));
  }, []);

  const copy = useCallback(
    async (text: string, label: string) => {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`, 'success');
    },
    [toast],
  );

  const runTool = async (tool: DeveloperMcpTool) => {
    setRunning(tool.name);
    setOutput('');
    try {
      const res = await runMcpViaSdk(tool, caseId);
      setOutput(JSON.stringify(res, null, 2));
      toast(`${tool.name} OK`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setOutput(msg);
      toast(msg, 'error');
    } finally {
      setRunning(null);
    }
  };

  const categories = useMemo(() => {
    if (!manifest) return [];
    const cats = new Map<string, DeveloperMcpTool[]>();
    for (const t of manifest.mcp.tools) {
      const list = cats.get(t.category) ?? [];
      list.push(t);
      cats.set(t.category, list);
    }
    return [...cats.entries()];
  }, [manifest]);

  if (!manifest) return <div className="case-skeleton h-40" />;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Why Cognee' },
    { id: 'mcp', label: `MCP (${manifest.mcp.toolCount})` },
    { id: 'cli', label: 'CLI' },
    { id: 'sdk', label: 'SDK' },
    { id: 'setup', label: 'Setup' },
  ];

  return (
    <section className={`developer-hub ${compact ? 'compact' : ''}`}>
      <div className="developer-hub-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Developer hub</p>
          <h2 className="font-sig text-xl font-bold text-white">MCP · CLI · SDK · Cognee lifecycle</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{manifest.pitch}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="ent-btn ent-btn-ghost ent-btn-sm"
            onClick={() => copy(JSON.stringify(manifest.mcp.config, null, 2), 'Full MCP config')}
            type="button"
          >
            Copy .mcp.json
          </button>
          <a
            className="ent-btn ent-btn-ghost ent-btn-sm"
            href={manifest.cogneeLinks.pythonApi}
            rel="noopener noreferrer"
            target="_blank"
          >
            Cognee Python API
          </a>
          <a
            className="ent-btn ent-btn-ghost ent-btn-sm"
            href={manifest.cogneeLinks.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            Cognee GitHub
          </a>
        </div>
      </div>

      <div className="developer-hub-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`platform-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="developer-hub-overview">
          <div className="developer-arch-flow">
            <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500 mb-2">Architecture</p>
            <pre className="developer-arch-pre">{manifest.architectureFlow.join('\n')}</pre>
          </div>
          <div className="developer-cognee-table">
            <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500 mb-3">
              How MemGateQA extends Cognee
            </p>
            <div className="developer-cognee-grid">
              {manifest.cogneeValue.map((row) => (
                <div key={row.op} className="developer-cognee-card">
                  <p className="developer-cognee-op">{row.op}</p>
                  <p className="developer-cognee-row">
                    <span className="developer-cognee-label">Cognee</span>
                    {row.cognee}
                  </p>
                  <p className="developer-cognee-row">
                    <span className="developer-cognee-label">MemGateQA</span>
                    {row.memgateqa}
                  </p>
                  <p className="developer-cognee-helps">{row.helps}</p>
                  <a
                    className="developer-cognee-link"
                    href={
                      manifest.cogneeLinks[
                        (row.op.replace('()', '').replace('memify', 'improve') as keyof typeof manifest.cogneeLinks)
                      ] ?? manifest.cogneeLinks.pythonApi
                    }
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Cognee docs →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'mcp' ? (
        <div className="developer-mcp-section">
          <p className="text-sm text-slate-500 mb-4">
            MCP stdio server at <code className="font-hud text-xs">{manifest.mcp.server}</code> — each tool calls{' '}
            <code className="font-hud text-xs">MEMGATEQA_BRIDGE_URL</code> then Cognee Cloud. Test any tool live below.
          </p>
          {categories.map(([cat, tools]) => (
            <div key={cat} className="developer-mcp-category">
              <p className="developer-mcp-cat-title">{cat}</p>
              <div className="developer-mcp-tools">
                {tools.map((tool) => {
                  const open = expandedTool === tool.name;
                  return (
                    <div key={tool.name} className={`developer-mcp-card ${open ? 'open' : ''}`}>
                      <button
                        className="developer-mcp-card-head"
                        onClick={() => setExpandedTool(open ? null : tool.name)}
                        type="button"
                      >
                        <span className="developer-mcp-name">{tool.name}</span>
                        {tool.cogneeOp ? <span className="developer-mcp-cognee">{tool.cogneeOp}</span> : null}
                        <span className="developer-mcp-chevron">{open ? '−' : '+'}</span>
                      </button>
                      {open ? (
                        <div className="developer-mcp-card-body">
                          <p className="text-sm text-slate-400">{tool.description}</p>
                          <p className="developer-mcp-sdk-ref">SDK: <code>{tool.sdkCall}</code></p>
                          <pre className="developer-args-pre">{JSON.stringify(tool.argsExample, null, 2)}</pre>
                          <button
                            className="ent-btn ent-btn-primary ent-btn-sm"
                            disabled={running !== null}
                            onClick={() => runTool(tool)}
                            type="button"
                          >
                            {running === tool.name ? 'Running…' : 'Test via bridge'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'cli' ? (
        <div className="developer-cli-section">
          <p className="text-sm text-slate-500 mb-4">
            Entry: <code className="font-hud text-xs">{manifest.cli.entry}</code> · npm wrapper:{' '}
            <code className="font-hud text-xs">{manifest.cli.npm}</code>
          </p>
          {manifest.cli.groups.map((g) => (
            <div key={g.group} className="developer-cli-group">
              <p className="developer-cli-group-title">{g.group}</p>
              {g.commands.map((c) => (
                <div key={c.cmd} className="developer-cli-row">
                  <div className="developer-cli-meta">
                    <p className="developer-cli-desc">{c.desc}</p>
                    <span className="developer-cli-maps">→ {c.maps}</span>
                  </div>
                  <code className="developer-cli-cmd">{c.cmd}</code>
                  <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => copy(c.cmd, 'CLI command')} type="button">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'sdk' ? (
        <div className="developer-sdk-section">
          <pre className="developer-sdk-import">{`import { createMemGateSdk } from './sdk/memgateSdk';
const sdk = createMemGateSdk('${caseId}');`}</pre>
          <div className="developer-sdk-grid">
            {manifest.sdk.methods.map((m) => (
              <div key={m.method} className="developer-sdk-card">
                <p className="developer-sdk-method">{m.method}</p>
                <p className="text-xs text-slate-500">{m.desc}</p>
                {m.cognee ? <span className="developer-sdk-cognee">Cognee: {m.cognee}</span> : null}
                <code className="developer-sdk-example">{m.example}</code>
                <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => copy(m.example, m.method)} type="button">
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'setup' ? (
        <div className="developer-setup-grid">
          {manifest.agentSetup.map((agent) => (
            <div key={agent.id} className="developer-setup-card">
              <div className="developer-setup-head">
                <span className="text-xl">{agent.icon}</span>
                <div>
                  <p className="font-sig font-bold text-white">{agent.name}</p>
                  <p className="text-xs text-slate-500">{agent.configFile}</p>
                </div>
              </div>
              <ol className="developer-setup-steps">
                {agent.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : null}

      {output ? <pre className="mcp-sdk-output developer-output">{output}</pre> : null}
    </section>
  );
}