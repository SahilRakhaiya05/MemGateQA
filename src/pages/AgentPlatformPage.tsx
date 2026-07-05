import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AgentBuilderChat } from '../components/AgentBuilderChat';
import { AgentPublishPanel } from '../components/AgentPublishPanel';
import { AgentWorkspace } from '../components/AgentWorkspace';
import { MemoryGraph3D } from '../components/MemoryGraph3D';
import { api, type AgentScaffold, type AgentTemplate, type CaseRecord, type ModelTier } from '../api/memgateqaApi';
import { getUserId } from '../lib/userId';
import { useToast } from '../components/Toast';
import { BUILD, NAV } from '../copy/brand';

type Phase = 'build' | 'chat' | 'publish';

const STEPS: { id: Phase; label: string; n: number }[] = [
  { id: 'build', label: 'Describe', n: 1 },
  { id: 'chat', label: 'Chat', n: 2 },
  { id: 'publish', label: 'Share', n: 3 },
];

export function AgentPlatformPage() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>('build');
  const [tiers, setTiers] = useState<ModelTier[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmModel, setLlmModel] = useState('');
  const [modelTier, setModelTier] = useState('balanced');
  const [scaffold, setScaffold] = useState<AgentScaffold | null>(null);
  const [agentCase, setAgentCase] = useState<CaseRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listModelTiers().then(setTiers).catch(() => {});
    api.listAgentTemplates().then(setTemplates).catch(() => {});
    api.getSettings().then((s) => {
      const p = s.status.llmProvider || s.settings.llm.provider || 'openai';
      setLlmProvider(p === 'mock' ? 'openai' : p);
      setLlmModel(s.status.llmModel || s.settings.llm.model);
    }).catch(() => {});
  }, []);

  const refreshCase = async (id: string) => {
    const c = await api.getCase(id);
    setAgentCase(c);
  };

  const createFromChat = async () => {
    if (!scaffold) {
      setError('Finish describing your agent in chat first');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.createAgentFromChat({
        scaffold,
        ownerId: getUserId(),
        llmProvider,
        llmModel,
        modelTier,
        indexMemory: true,
      });
      setAgentCase(res.case);
      setPhase('chat');
      toast('Agent live — memory indexed', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const createFromTemplate = async (templateId: string) => {
    const name = prompt('Agent name:', 'My Agent');
    if (!name?.trim()) return;
    setBusy(true);
    try {
      const res = await api.createAgent({
        agentName: name.trim(),
        templateId,
        llmProvider,
        llmModel,
        modelTier,
        ownerId: getUserId(),
        launch: false,
        indexMemory: true,
      });
      setAgentCase(res.case);
      setPhase('chat');
      toast('Agent created', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === phase);
  const featuredTemplate = templates.find((t) => t.featured);
  const previewCaseId = agentCase?.id ?? 'case-data-dna';

  return (
    <div className="agent-create-page mx-auto max-w-7xl">
      <div className="agent-create-top">
        <Link className="breadcrumb-link" to="/agents">
          ← {NAV.agents.label}
        </Link>
        <Link className="breadcrumb-link" to="/studio">
          {NAV.studio.label} →
        </Link>
      </div>

      <header className="vegas-hero text-left">
        <p className="vegas-hero-kicker text-left">{BUILD.chatTitle}</p>
        <h1 className="vegas-hero-title text-left">{BUILD.title}</h1>
        <p className="vegas-hero-sub text-left mx-0">{BUILD.sub}</p>
      </header>

      <nav className="agent-create-stepper" aria-label="Create progress">
        {STEPS.map((s, i) => {
          const done = agentCase ? i < stepIndex : i === 0 && stepIndex > 0;
          const active = s.id === phase;
          const locked = !agentCase && s.id !== 'build';
          return (
            <button
              key={s.id}
              className={`agent-create-step ${active ? 'active' : ''} ${done ? 'done' : ''} ${locked ? 'locked' : ''}`}
              disabled={locked}
              onClick={() => agentCase && setPhase(s.id)}
              type="button"
            >
              <span className="agent-create-step-n">{s.n}</span>
              <span className="agent-create-step-label">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {error ? <p className="agent-create-error">{error}</p> : null}

      {phase === 'build' ? (
        <div className="agent-create-split">
          <section className="agent-create-chat-col">
            <AgentBuilderChat
              disabled={busy}
              llmModel={llmModel}
              llmProvider={llmProvider}
              modelTier={modelTier}
              onModelChange={setLlmModel}
              onProviderChange={setLlmProvider}
              onScaffoldReady={setScaffold}
              onTierChange={setModelTier}
              tiers={tiers}
            />
            <div className="agent-create-footer-bar">
              <button
                className="vegas-neon-btn"
                disabled={busy || !scaffold}
                onClick={createFromChat}
                type="button"
              >
                {busy ? 'Launching…' : scaffold ? `${BUILD.createCta} ${scaffold.agentName}` : BUILD.createCta}
              </button>
              <details className="agent-template-details" open={!!featuredTemplate}>
                <summary>Or pick a starter template</summary>
                {featuredTemplate ? (
                  <button
                    className="ent-template-card text-left mt-3 w-full ring-1 ring-violet-400/40"
                    disabled={busy}
                    onClick={() => createFromTemplate(featuredTemplate.id)}
                    type="button"
                  >
                    <span className="font-hud text-[9px] uppercase text-violet-300">Demo ready · featured</span>
                    <span className="font-medium text-white block mt-1">{featuredTemplate.name}</span>
                    <span className="mt-1 block text-xs text-slate-400">{featuredTemplate.description}</span>
                    <span className="mt-2 block text-[10px] text-cyan-400/80">
                      {featuredTemplate.evidence} evidence · {featuredTemplate.traps} traps · graph + belt demo
                    </span>
                  </button>
                ) : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {templates.filter((t) => !t.featured).map((t) => (
                    <button
                      key={t.id}
                      className="ent-template-card text-left"
                      disabled={busy}
                      onClick={() => createFromTemplate(t.id)}
                      type="button"
                    >
                      <span className="font-medium text-white">{t.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{t.description}</span>
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </section>
          <aside className="agent-create-preview-col">
            <p className="agent-create-preview-label">Memory map preview</p>
            <MemoryGraph3D caseId={previewCaseId} compact height={400} />
            <p className="agent-create-preview-hint">
              {agentCase
                ? 'Your agent — nodes update when memory changes'
                : 'Reference map — yours fills in after launch'}
            </p>
          </aside>
        </div>
      ) : null}

      {phase === 'chat' && agentCase ? (
        <div className="agent-create-split agent-create-split-chat">
          <section className="agent-create-chat-col">
            <AgentWorkspace caseData={agentCase} chatOnly />
          </section>
          <aside className="agent-create-preview-col">
            <MemoryGraph3D caseId={agentCase.id} evidence={agentCase.evidence} height={440} />
            <button className="ent-btn ent-btn-primary w-full mt-3" onClick={() => setPhase('publish')} type="button">
              Share link →
            </button>
          </aside>
        </div>
      ) : null}

      {phase === 'publish' && agentCase ? (
        <section className="agent-create-publish ent-card p-6 max-w-2xl">
          <AgentPublishPanel
            caseData={agentCase}
            onPublished={async () => {
              await refreshCase(agentCase.id);
            }}
          />
          <button className="ent-btn ent-btn-ghost mt-4" onClick={() => setPhase('chat')} type="button">
            ← Back to chat
          </button>
        </section>
      ) : null}
    </div>
  );
}