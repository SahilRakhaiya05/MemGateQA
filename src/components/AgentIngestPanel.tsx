import { useRef, useState } from 'react';
import { api } from '../api/memgateqaApi';
import { useToast } from './Toast';

interface IngestChunk {
  title: string;
  body: string;
  source?: string;
  sensitivity?: string;
}

interface AgentIngestPanelProps {
  onIngest: (summary: string, chunks: IngestChunk[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function AgentIngestPanel({ onIngest, disabled, compact }: AgentIngestPanelProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(!compact);

  const runIngest = async (extraText?: string) => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      const res = await api.parseEvidence({
        text: [paste, extraText].filter(Boolean).join('\n\n'),
        url: url.trim() || undefined,
      });
      const chunks = res.chunks ?? [];
      if (!chunks.length) {
        toast('No usable content found — try more text or a different URL', 'error');
        return;
      }
      const summary = chunks
        .map((c, i) => `${i + 1}. ${c.title}: ${c.body.slice(0, 200)}`)
        .join('\n');
      onIngest(
        `I imported ${chunks.length} facts from ${res.source ?? 'ingest'}:\n\n${summary}`,
        chunks,
      );
      toast(`Imported ${chunks.length} memory facts`, 'success');
      setPaste('');
      setUrl('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Ingest failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    await runIngest(text.slice(0, 16000));
  };

  if (compact && !open) {
    return (
      <button className="agent-ingest-toggle" disabled={disabled} onClick={() => setOpen(true)} type="button">
        + Import docs / URL / file (like Hindsight & Cognost — we turn it into QA traps)
      </button>
    );
  }

  return (
    <div className="agent-ingest-panel">
      <div className="agent-ingest-head">
        <div>
          <p className="font-hud text-[10px] uppercase tracking-wider text-emerald-400">Memory ingest</p>
          <p className="text-xs text-slate-500">
            Competitors ingest files & URLs for chat. We ingest for <strong className="text-slate-300">Cognee + trap QA</strong>.
          </p>
        </div>
        {compact ? (
          <button className="ent-btn ent-btn-ghost ent-btn-sm" onClick={() => setOpen(false)} type="button">
            Hide
          </button>
        ) : null}
      </div>

      <div className="agent-ingest-grid">
        <label className="agent-ingest-field">
          <span>URL</span>
          <input
            className="ent-input"
            disabled={disabled || busy}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.yourproduct.com/…"
            value={url}
          />
        </label>
        <label className="agent-ingest-field span-2">
          <span>Paste text or markdown</span>
          <textarea
            className="ent-input min-h-[72px]"
            disabled={disabled || busy}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Paste runbooks, policies, README sections…"
            value={paste}
          />
        </label>
      </div>

      <div className="agent-ingest-actions">
        <button className="ent-btn ent-btn-secondary ent-btn-sm" disabled={disabled || busy} onClick={() => runIngest()} type="button">
          {busy ? 'Parsing…' : 'Parse into facts'}
        </button>
        <button
          className="ent-btn ent-btn-ghost ent-btn-sm"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          Upload .txt / .md
        </button>
        <input
          ref={fileRef}
          accept=".txt,.md,.markdown,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
          type="file"
        />
      </div>
    </div>
  );
}