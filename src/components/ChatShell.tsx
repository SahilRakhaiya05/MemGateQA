import { useEffect, useRef, type ReactNode } from 'react';

export interface ChatShellMessage {
  role: 'user' | 'assistant';
  content: string;
  meta?: string;
  extra?: ReactNode;
}

interface ChatShellProps {
  title: string;
  subtitle?: string;
  messages: ChatShellMessage[];
  busy?: boolean;
  thinkingLabel?: string;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  starters?: string[];
  onStarter?: (text: string) => void;
  toolbar?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  composerHint?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export function ChatShell({
  title,
  subtitle,
  messages,
  busy,
  thinkingLabel,
  input,
  onInputChange,
  onSend,
  placeholder = 'Message…',
  starters,
  onStarter,
  toolbar,
  headerActions,
  footer,
  composerHint = 'Enter to send · Shift+Enter for newline',
  multiline = true,
  disabled,
}: ChatShellProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const submit = () => {
    if (busy || disabled || !input.trim()) return;
    onSend();
  };

  return (
    <div className="chat-shell">
      <header className="chat-shell-header">
        <div className="chat-shell-header-text">
          <h2 className="chat-shell-title">{title}</h2>
          {subtitle ? <p className="chat-shell-subtitle">{subtitle}</p> : null}
        </div>
        {headerActions ? <div className="chat-shell-header-actions">{headerActions}</div> : null}
      </header>

      {toolbar ? <div className="chat-shell-toolbar">{toolbar}</div> : null}

      <div ref={logRef} className="chat-shell-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-shell-row ${msg.role}`}>
            <div className="chat-shell-avatar" aria-hidden>
              {msg.role === 'user' ? (
                <span className="chat-shell-avatar-user">You</span>
              ) : (
                <span className="chat-shell-avatar-ai">MQ</span>
              )}
            </div>
            <div className="chat-shell-bubble-wrap">
              <div className={`chat-shell-bubble ${msg.role}`}>
                <p className="chat-shell-text whitespace-pre-wrap">{msg.content}</p>
                {msg.extra}
              </div>
              {msg.meta ? <p className="chat-shell-meta">{msg.meta}</p> : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="chat-shell-thinking">
            <span className="chat-shell-thinking-dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <span>{thinkingLabel || 'Thinking…'}</span>
          </div>
        ) : null}
      </div>

      {starters?.length && messages.length <= 1 ? (
        <div className="chat-shell-starters">
          {starters.map((s) => (
            <button
              key={s}
              className="chat-shell-starter"
              disabled={busy || disabled}
              onClick={() => onStarter?.(s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="chat-shell-composer">
        <div className="chat-shell-composer-inner">
          {multiline ? (
            <textarea
              ref={inputRef}
              className="chat-shell-input"
              disabled={busy || disabled}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder}
              rows={1}
              value={input}
            />
          ) : (
            <input
              className="chat-shell-input chat-shell-input-single"
              disabled={busy || disabled}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={placeholder}
              value={input}
            />
          )}
          <button
            className="chat-shell-send"
            disabled={busy || disabled || !input.trim()}
            onClick={submit}
            type="button"
          >
            {busy ? '…' : '↑'}
          </button>
        </div>
        <p className="chat-shell-composer-hint">{composerHint}</p>
      </div>

      {footer ? <div className="chat-shell-footer">{footer}</div> : null}
    </div>
  );
}