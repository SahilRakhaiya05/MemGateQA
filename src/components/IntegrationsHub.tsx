import { useEffect, useState } from 'react';
import { api, type IntegrationsSnapshot } from '../api/memgateqaApi';

interface IntegrationsHubProps {
  compact?: boolean;
}

function statusDot(on: boolean) {
  return on ? 'live' : 'offline';
}

function llmConfigured(data: IntegrationsSnapshot): boolean {
  if (data.llm.provider === 'openai') return Boolean(data.llm.openai);
  if (data.llm.provider === 'gemini') return Boolean(data.llm.geminiReachable ?? data.llm.gemini);
  return false;
}

export function IntegrationsHub({ compact }: IntegrationsHubProps) {
  const [data, setData] = useState<IntegrationsSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .integrations()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <section className={`integrations-hub ${compact ? 'integrations-hub-compact' : ''}`}>
        <p className="text-sm text-red-300">Integrations unavailable — {error}</p>
      </section>
    );
  }

  if (!data) return <div className="case-skeleton h-24" />;

  const llmLabel = data.llm.provider
    ? `${data.llm.provider} · ${data.llm.model}`
    : 'Not configured';

  const tiles = [
    {
      id: 'cognee',
      label: 'Cognee Cloud',
      value: data.cognee.reachable ? 'Connected' : 'Not connected',
      on: data.cognee.reachable,
      hint: data.cognee.dataset,
    },
    {
      id: 'llm',
      label: 'LLM agent',
      value: llmLabel,
      on: llmConfigured(data),
      hint: data.llm.openai ? 'OpenAI key set' : data.llm.gemini ? 'Google AI key set' : 'Set OPENAI_API_KEY or API key in Settings',
    },
    {
      id: 'memory',
      label: 'MemGate Memory',
      value: `${data.memgateMemory.documents} docs · ${data.memgateMemory.facts} facts`,
      on: data.memgateMemory.enabled,
      hint: `Engine ${data.memgateMemory.version} · ${data.memgateMemory.containers} containers`,
    },
    {
      id: 'mcp',
      label: 'MemGateQA MCP',
      value: 'stdio server',
      on: true,
      hint: data.mcp.memgateqa.command,
    },
  ];

  return (
    <section className={`integrations-hub ${compact ? 'integrations-hub-compact' : ''}`}>
      <div className="integrations-hub-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-cyan-300">Integration fabric</p>
          <h3 className="font-sig text-lg font-bold text-white">
            {compact ? 'Stack status' : 'Cognee · MemGate Memory · LLM · MCP'}
          </h3>
        </div>
        {!compact && data.loopEngineering?.repo ? (
          <a
            className="ent-btn ent-btn-ghost ent-btn-sm"
            href={data.loopEngineering.repo}
            rel="noreferrer"
            target="_blank"
          >
            Loop pattern ↗
          </a>
        ) : null}
      </div>

      <div className="integrations-grid">
        {tiles.map((tile) => (
          <div key={tile.id} className="integrations-tile">
            <span className={`integrations-dot ${statusDot(tile.on)}`} />
            <div>
              <p className="integrations-tile-label">{tile.label}</p>
              <p className="integrations-tile-value">{tile.value}</p>
              <p className="integrations-tile-hint">{tile.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {!compact ? (
        <div className="integrations-loop">
          <p className="font-hud text-[9px] uppercase tracking-wider text-slate-500">Agent loop</p>
          <p className="text-sm text-slate-400">{data.loopEngineering.pattern}</p>
          <div className="integrations-loop-steps">
            {data.loopEngineering.steps.map((step) => (
              <span key={step.id} className="integrations-loop-pill">
                {step.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}