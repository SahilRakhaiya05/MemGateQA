import { useState } from 'react';
import { api, type AgentScaffold, type ModelTier } from '../api/memgateqaApi';
import { AgentIngestPanel } from './AgentIngestPanel';
import { AgentModelPicker } from './AgentModelPicker';
import { ChatShell } from './ChatShell';
import { BUILD } from '../copy/brand';

interface BuilderMessage {
  role: 'user' | 'assistant';
  content: string;
  scaffold?: AgentScaffold | null;
}

interface AgentBuilderChatProps {
  tiers: ModelTier[];
  llmProvider: string;
  llmModel: string;
  modelTier: string;
  onProviderChange: (p: string) => void;
  onModelChange: (m: string) => void;
  onTierChange: (t: string) => void;
  onScaffoldReady: (scaffold: AgentScaffold) => void;
  disabled?: boolean;
}

export function AgentBuilderChat({
  tiers,
  llmProvider,
  llmModel,
  modelTier,
  onProviderChange,
  onModelChange,
  onTierChange,
  onScaffoldReady,
  disabled,
}: AgentBuilderChatProps) {
  const [messages, setMessages] = useState<BuilderMessage[]>([
    {
      role: 'assistant',
      content:
        'Describe your agent in plain English — what it should know, who it talks to, and what it must never leak. I\'ll draft memory, safety rules, and recall tests.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [toolsOpen, setToolsOpen] = useState(false);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy || disabled) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setThinkingStep(BUILD.thinking);
    try {
      const res = await api.builderChat({
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        llmProvider,
        llmModel,
        modelTier,
      });
      setThinkingStep('Almost ready…');
      const assistantMsg: BuilderMessage = {
        role: 'assistant',
        content: res.reply,
        scaffold: res.scaffold ?? undefined,
      };
      setMessages((m) => [...m, assistantMsg]);
      if (res.scaffold?.agentName && res.readyToCreate) onScaffoldReady(res.scaffold);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: err instanceof Error ? err.message : 'Builder failed' },
      ]);
    } finally {
      setBusy(false);
      setThinkingStep('');
    }
  };

  const shellMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    extra: msg.scaffold ? (
      <div className="chat-scaffold-card">
        <p className="chat-scaffold-kicker">Ready to launch</p>
        <p className="chat-scaffold-name">{msg.scaffold.agentName}</p>
        <p className="chat-scaffold-purpose">{msg.scaffold.purpose}</p>
        <div className="chat-scaffold-stats">
          <span>{msg.scaffold.evidence.length} memory facts</span>
          <span>{msg.scaffold.tests.length} recall checks</span>
        </div>
      </div>
    ) : undefined,
  }));

  return (
    <ChatShell
      busy={busy}
      composerHint="Enter to send · Shift+Enter for newline"
      disabled={disabled}
      input={input}
      messages={shellMessages}
      multiline
      onInputChange={setInput}
      onSend={() => send(input)}
      onStarter={send}
      placeholder={BUILD.placeholder}
      starters={[...BUILD.starters]}
      subtitle={BUILD.chatSub}
      thinkingLabel={thinkingStep}
      title={BUILD.chatTitle}
      toolbar={
        <div className="chat-shell-tools">
          <button
            className={`chat-shell-tools-toggle ${toolsOpen ? 'open' : ''}`}
            onClick={() => setToolsOpen((v) => !v)}
            type="button"
          >
            {toolsOpen ? 'Hide tools' : 'Model & ingest'}
          </button>
          {toolsOpen ? (
            <div className="chat-shell-tools-panel">
              <AgentModelPicker
                model={llmModel}
                provider={llmProvider}
                tier={modelTier}
                onModelChange={onModelChange}
                onProviderChange={onProviderChange}
                onTierChange={onTierChange}
                tiers={tiers}
                disabled={disabled}
                compact
              />
              <AgentIngestPanel
                compact
                disabled={disabled}
                onIngest={(summary, chunks) => {
                  const note = `${summary}\n\n${chunks.map((c) => `• ${c.title}: ${c.body.slice(0, 200)}`).join('\n')}`;
                  setMessages((m) => [
                    ...m,
                    { role: 'user', content: `Add this to the agent memory:\n${note}` },
                  ]);
                  setInput(note);
                }}
              />
            </div>
          ) : null}
        </div>
      }
    />
  );
}