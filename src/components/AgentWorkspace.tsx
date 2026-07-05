import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type CaseRecord, type ModelTier } from '../api/memgateqaApi';
import { AgentChatPanel } from './AgentChatPanel';
import { AgentModelPicker } from './AgentModelPicker';
import { MemoryRiskPanel } from './MemoryRiskPanel';
import { SkillScoreRing } from './SkillScoreRing';

interface AgentWorkspaceProps {
  caseData: CaseRecord;
  publicSlug?: string;
  actions?: React.ReactNode;
  showModelSettings?: boolean;
  /** Hide title header when parent already shows agent name (e.g. case belt). */
  embedded?: boolean;
  /** Chat-only surface — no duplicate header, risks, or footer links. */
  chatOnly?: boolean;
}

/** One agent surface — header, status, model slate, risks, chat. No duplicate strips. */
export function AgentWorkspace({
  caseData,
  publicSlug,
  actions,
  showModelSettings = true,
  embedded = false,
  chatOnly = false,
}: AgentWorkspaceProps) {
  const [tiers, setTiers] = useState<ModelTier[]>([]);
  const [provider, setProvider] = useState(caseData.llmProvider || 'openai');
  const [model, setModel] = useState(caseData.llmModel || '');
  const [tier, setTier] = useState(caseData.modelTier || 'balanced');
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    api.listModelTiers().then(setTiers).catch(() => {});
  }, []);

  useEffect(() => {
    if (caseData.llmProvider) setProvider(caseData.llmProvider);
    if (caseData.llmModel) setModel(caseData.llmModel);
    if (caseData.modelTier) setTier(caseData.modelTier);
  }, [caseData.llmProvider, caseData.llmModel, caseData.modelTier]);

  const persistConfig = (p: string, m: string, t: string) => {
    if (publicSlug) return;
    api.updateAgentConfig(caseData.id, { llmProvider: p, llmModel: m, modelTier: t }).catch(() => {});
  };

  if (chatOnly) {
    return (
      <div className="agent-workspace agent-workspace-chat-only">
        <AgentChatPanel caseData={caseData} publicSlug={publicSlug} />
      </div>
    );
  }

  return (
    <div className="agent-workspace">
      {!embedded ? (
        <header className="agent-workspace-head">
          <SkillScoreRing score={caseData.lastScore} size={52} />
          <div className="agent-workspace-title">
            <h2 className="font-sig text-xl font-bold text-white">{caseData.agent || caseData.name}</h2>
            <p className="text-sm text-slate-400 line-clamp-2">{caseData.description}</p>
            {!publicSlug ? (
              <p className="mt-1 text-xs text-slate-500">
                <code className="text-cyan-400">{caseData.dataset}</code>
                {' · '}
                {caseData.evidence?.length ?? 0} facts · {caseData.tests?.length ?? 0} traps
              </p>
            ) : null}
          </div>
          {actions ? <div className="agent-workspace-actions">{actions}</div> : null}
        </header>
      ) : actions ? (
        <div className="agent-workspace-actions-only">{actions}</div>
      ) : null}

      {!publicSlug ? <MemoryRiskPanel caseData={caseData} compact /> : null}

      {showModelSettings && tiers.length && !publicSlug ? (
        <details className="agent-workspace-model" onToggle={(e) => setModelOpen((e.target as HTMLDetailsElement).open)}>
          <summary>Model slate · {provider} · {model || tier}</summary>
          {modelOpen ? (
            <AgentModelPicker
              compact
              model={model}
              onModelChange={(m) => {
                setModel(m);
                persistConfig(provider, m, tier);
              }}
              onProviderChange={(p) => {
                setProvider(p);
                persistConfig(p, model, tier);
              }}
              onTierChange={(t) => {
                setTier(t);
                persistConfig(provider, model, t);
              }}
              provider={provider}
              tier={tier}
              tiers={tiers}
            />
          ) : null}
        </details>
      ) : null}

      <AgentChatPanel caseData={caseData} publicSlug={publicSlug} />

      {!publicSlug ? (
        <div className="agent-workspace-foot flex flex-wrap gap-2 text-xs">
          <Link className="text-cyan-400 hover:text-cyan-300" to={`/cases/${caseData.id}`}>
            QA dashboard
          </Link>
          <span className="text-slate-600">·</span>
          <Link className="text-cyan-400 hover:text-cyan-300" to={`/cases/${caseData.id}/agent`}>
            Automation
          </Link>
        </div>
      ) : null}
    </div>
  );
}