import type { EvidenceItem } from '../api/memgateqaApi';

const SENSITIVITY_STYLE: Record<string, string> = {
  private: 'dossier-private',
  secret: 'dossier-secret',
  internal: 'dossier-internal',
  public: 'dossier-public',
};

const KIND_ICON: Record<string, string> = {
  meeting: '📋',
  decision: '⚖️',
  trace: '🤖',
  private: '🔒',
  policy: '📜',
  manual: '📎',
};

interface EvidenceDossierProps {
  items: EvidenceItem[];
  indexedIds?: Record<string, string>;
  onRemove?: (id: string) => void;
}

export function EvidenceDossier({ items, indexedIds = {}, onRemove }: EvidenceDossierProps) {
  if (!items.length) {
    return (
      <div className="ent-empty">
        <p className="text-slate-400">No evidence queued. Add documents to start the intake line.</p>
      </div>
    );
  }

  return (
    <div className="dossier-grid">
      {items.map((ev, idx) => {
        const sensClass = SENSITIVITY_STYLE[ev.sensitivity] ?? 'dossier-internal';
        const icon = KIND_ICON[ev.kind] ?? '📄';
        return (
          <article key={ev.id} className={`focus-card dossier-card ${sensClass}`} style={{ transform: `rotate(${(idx % 3) - 1}deg)` }}>
            <div className="dossier-card-top">
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <h3 className="font-sig text-sm font-bold">{ev.title}</h3>
                <p className="font-hud text-[9px] uppercase opacity-70">
                  {ev.kind} · {ev.sensitivity} · {ev.date}
                </p>
              </div>
              {indexedIds[ev.id] ? (
                <span className="dossier-badge dossier-badge-indexed">✓ cognee</span>
              ) : ev.shouldRemember ? (
                <span className="dossier-badge">remember</span>
              ) : (
                <span className="dossier-badge dossier-badge-muted">skip</span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed opacity-90 line-clamp-3">{ev.body}</p>
            {onRemove ? (
              <button
                className="mt-3 rounded border border-black/20 px-2 py-1 text-[10px] font-bold uppercase opacity-60 hover:opacity-100"
                onClick={() => onRemove(ev.id)}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}