import { useCallback, useEffect, useState } from 'react';
import { api, type AgentChatResult, type CaseRecord } from '../api/memgateqaApi';
import { ChatShell } from './ChatShell';
import { useToast } from './Toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  meta?: string;
  recallPreview?: string;
}

interface AgentChatPanelProps {
  caseData: CaseRecord;
  publicSlug?: string;
}

const DEFAULT_PROMPTS = [
  'Summarize what you remember',
  'What must never be shared?',
  'Any open memory risks?',
];

export function AgentChatPanel({ caseData, publicSlug }: AgentChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [loaded, setLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      if (publicSlug) {
        const pub = await api.getPublicAgent(publicSlug);
        setMessages([
          {
            role: 'assistant',
            content: `I'm ${pub.agent}. Answers use published Cognee memory only.`,
            meta: `Health ${pub.lastScore ?? '—'}%`,
          },
        ]);
        setPrompts(DEFAULT_PROMPTS);
        setLoaded(true);
        return;
      }
      const data = await api.agentChatHistory(caseData.id);
      const hist: ChatMessage[] = (data.history ?? []).map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
        meta: h.provider ? `${h.provider} · ${h.model ?? ''}` : undefined,
        recallPreview: h.recallPreview,
      }));
      if (!hist.length && data.welcome) {
        hist.push({ role: 'assistant', content: data.welcome });
      }
      setMessages(hist);
      setPrompts(data.chatPrompts?.length ? data.chatPrompts : DEFAULT_PROMPTS);
      setLoaded(true);
    } catch {
      setMessages([
        {
          role: 'assistant',
          content: `${caseData.agent || caseData.name} is ready — ask anything grounded in memory.`,
        },
      ]);
      setPrompts(DEFAULT_PROMPTS);
      setLoaded(true);
    }
  }, [caseData, publicSlug]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    setThinkingStep('Cognee recall()…');
    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-14)
        .map((m) => ({ role: m.role, content: m.content }));
      setThinkingStep('Composing reply…');
      const res: AgentChatResult = publicSlug
        ? await api.publicAgentChat(publicSlug, message, history)
        : await api.agentChat(caseData.id, message, history);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.answer,
          meta: [res.provider, res.model].filter(Boolean).join(' · ') || undefined,
          recallPreview: res.recallPreview,
        },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Chat failed';
      toast(errMsg, 'error');
      setMessages((m) => [...m, { role: 'assistant', content: errMsg }]);
    } finally {
      setBusy(false);
      setThinkingStep('');
    }
  };

  const clearChat = async () => {
    if (publicSlug) return;
    try {
      await api.clearAgentChat(caseData.id);
      await loadHistory();
      toast('Chat cleared', 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Clear failed', 'error');
    }
  };

  if (!loaded) return <div className="case-skeleton h-64 rounded-2xl" />;

  const shellMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    meta: msg.meta,
    extra:
      msg.recallPreview && msg.role === 'assistant' ? (
        <details className="chat-recall-preview">
          <summary>Memory recalled</summary>
          <p>{msg.recallPreview}</p>
        </details>
      ) : undefined,
  }));

  return (
    <ChatShell
      busy={busy}
      composerHint="Enter to send"
      footer={
        !publicSlug ? (
          <button className="chat-shell-clear" onClick={clearChat} type="button">
            Clear conversation
          </button>
        ) : null
      }
      input={input}
      messages={shellMessages}
      multiline
      onInputChange={setInput}
      onSend={() => send(input)}
      onStarter={send}
      placeholder="Ask grounded in Cognee memory…"
      starters={prompts}
      subtitle={caseData.dataset ? `Dataset ${caseData.dataset}` : undefined}
      thinkingLabel={thinkingStep}
      title={caseData.agent || caseData.name}
    />
  );
}