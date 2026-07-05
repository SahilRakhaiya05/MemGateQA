export interface BeltPacket {
  id: string;
  title: string;
  private?: boolean;
  indexed?: boolean;
}

interface ConveyorBeltProps {
  packets: BeltPacket[];
  running?: boolean;
  fast?: boolean;
  slow?: boolean;
  label?: string;
  showCount?: boolean;
  footLeft?: string;
  footRight?: string;
  embedded?: boolean;
  focusId?: string | null;
  onFocusChange?: (id: string) => void;
  phaseLabel?: string;
}

function packetStatus(packet: BeltPacket, fast: boolean, reading: boolean): string {
  if (packet.indexed) return 'Indexed in Cognee graph';
  if (reading) return 'Reading packet…';
  if (packet.private) return fast ? 'Indexing private packet…' : 'Private — awaiting remember()';
  return fast ? 'remember() in progress…' : 'Queued for remember()';
}

/** Single-folder belt — one packet in view, queue strip below, no repeat loops. */
export function ConveyorBelt({
  packets,
  running = false,
  fast = false,
  slow = false,
  label = 'Memory belt',
  showCount = true,
  footLeft = 'Queue',
  footRight = 'In Cognee',
  embedded = false,
  focusId,
  onFocusChange,
  phaseLabel,
}: ConveyorBeltProps) {
  const indexedCount = packets.filter((p) => p.indexed).length;
  const queueCount = Math.max(0, packets.length - indexedCount);
  const indexPct = packets.length ? Math.round((indexedCount / packets.length) * 100) : 0;
  const reading = running && slow && !fast;

  const active =
    (focusId ? packets.find((p) => p.id === focusId) : null) ??
    packets.find((p) => !p.indexed) ??
    packets[0] ??
    null;

  const jammed = queueCount > 3 && running;

  const announcer = phaseLabel
    ? phaseLabel
    : active
      ? `${active.title} — ${packetStatus(active, fast, reading)}`
      : packets.length
        ? 'Standby — press Run audit on the belt'
        : 'Add evidence packets to start the belt';

  const statusLabel = fast ? '◆ INDEXING' : running ? (slow ? '◈ READING' : '● ACTIVE') : '○ STANDBY';

  return (
    <div className="conveyor-belt-wrap">
      {embedded ? null : (
        <div className="conveyor-belt-head">
          <span className="font-hud text-[9px] uppercase tracking-widest text-slate-500">{label}</span>
          <div className="flex items-center gap-3">
            {showCount && packets.length > 0 ? (
              <span className="font-hud text-[9px] uppercase tracking-wider text-slate-500">
                {packets.length} memory{packets.length !== 1 ? ' items' : ''}
              </span>
            ) : null}
            <span className={`conveyor-belt-status ${running ? 'live' : 'idle'} ${fast ? 'fast' : ''}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      )}

      <p className="conveyor-belt-announcer" title={announcer}>
        {announcer}
      </p>

      {packets.length > 0 ? (
        <div className="conveyor-index-bar">
          <div className="conveyor-index-fill" style={{ width: `${indexPct}%` }} />
          <span className="conveyor-index-label">
            {indexedCount}/{packets.length} indexed · {indexPct}%
          </span>
        </div>
      ) : null}

      <div
        className={`conveyor-belt conveyor-belt-single ${jammed ? 'jammed' : ''} ${fast ? 'fast' : ''} ${packets.length > 0 ? 'has-packets' : ''}`}
      >
        <div
          className={`conveyor-tread ${running ? '' : 'paused'} ${fast ? 'fast' : ''} ${slow ? 'slow' : ''}`}
        />
        <div className="conveyor-rail top" />
        <div className="conveyor-rail bot" />

        <div className="conveyor-slot conveyor-slot-queue">
          <span className="conveyor-slot-num">{queueCount}</span>
          <span className="conveyor-slot-label">queued</span>
        </div>

        {!active ? (
          <div className="conveyor-empty">
            <span className="conveyor-empty-icon">📭</span>
            <span>Add memory evidence</span>
          </div>
        ) : (
          <button
            className={`conveyor-folder conveyor-folder-single ${active.private ? 'private' : ''} ${active.indexed ? 'indexed' : ''} ${running && fast ? 'moving-once' : 'parked-center'} ${focusId === active.id ? 'focused' : ''}`}
            key={active.id}
            onClick={() => onFocusChange?.(active.id)}
            title={`${active.id} — ${active.title}`}
            type="button"
          >
            <div className="conveyor-folder-body">
              <div className="conveyor-folder-tape" />
              <span className="conveyor-folder-id">{active.id}</span>
              <span className="conveyor-folder-title">{active.title}</span>
              {active.indexed ? <span className="conveyor-folder-badge">✓</span> : null}
            </div>
          </button>
        )}

        <div className="conveyor-slot conveyor-slot-done">
          <span className="conveyor-slot-num">{indexedCount}</span>
          <span className="conveyor-slot-label">indexed</span>
        </div>

        {packets.length > 1 ? (
          <div className="conveyor-queue-strip" role="list">
            {packets.map((p) => (
              <button
                key={p.id}
                className={`conveyor-queue-item ${p.id === active?.id ? 'active' : ''} ${p.indexed ? 'done' : ''} ${p.private ? 'private' : ''}`}
                onClick={() => onFocusChange?.(p.id)}
                title={`${p.id} — ${p.title}`}
                type="button"
              >
                <span className="conveyor-queue-dot">{p.indexed ? '✓' : '○'}</span>
                <span className="conveyor-queue-label">{p.title}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="conveyor-belt-foot">
        <span>
          {footLeft} · {queueCount}
        </span>
        <span className={jammed ? 'text-overflow-amber' : running || phaseLabel ? 'text-theme-accent' : ''}>
          {active ? packetStatus(active, fast, reading) : 'Select memory'}
        </span>
        <span>
          {footRight} · {indexedCount}
        </span>
      </div>
    </div>
  );
}