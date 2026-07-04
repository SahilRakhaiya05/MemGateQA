import { motion } from 'framer-motion';

export interface BeltPacket {
  id: string;
  title: string;
  private?: boolean;
  indexed?: boolean;
}

interface ConveyorBeltProps {
  packets: BeltPacket[];
  /** Belt animates when true. Defaults to true if any packets exist. */
  running?: boolean;
  /** Faster tread + folders during Cognee write */
  fast?: boolean;
  label?: string;
  showCount?: boolean;
  footLeft?: string;
  footRight?: string;
  /** Hide duplicate live/standby chip when arena header shows status */
  embedded?: boolean;
  /** Highlighted packet on belt */
  focusId?: string | null;
  onFocusChange?: (id: string) => void;
}

export function ConveyorBelt({
  packets,
  running,
  fast = false,
  label = 'Sortation belt',
  showCount = true,
  footLeft = 'Queue',
  footRight = 'Indexed',
  embedded = false,
  focusId,
  onFocusChange,
}: ConveyorBeltProps) {
  const visible = packets.slice(0, 8);
  const isRunning = running ?? visible.length > 0;
  const jammed = packets.length > 4;
  const overflow = Math.max(0, packets.length - 4);
  const indexedCount = packets.filter((p) => p.indexed).length;

  return (
    <div className="conveyor-belt-wrap">
      {embedded ? null : (
        <div className="conveyor-belt-head">
          <span className="font-hud text-[9px] uppercase tracking-widest text-slate-500">{label}</span>
          <div className="flex items-center gap-3">
            {showCount && packets.length > 0 ? (
              <span className="font-hud text-[9px] uppercase tracking-wider text-slate-500">
                {packets.length} pkt{packets.length !== 1 ? 's' : ''}
                {indexedCount > 0 ? ` · ${indexedCount} in Cognee` : ''}
              </span>
            ) : null}
            <span className={`conveyor-belt-status ${isRunning ? 'live' : 'idle'} ${fast ? 'fast' : ''}`}>
              {fast ? '◆ INDEXING' : isRunning ? '● BELT LIVE' : '○ STANDBY'}
            </span>
          </div>
        </div>
      )}

      <div className={`conveyor-belt ${jammed ? 'jammed' : ''} ${fast ? 'fast' : ''}`}>
        <div className={`conveyor-tread ${isRunning ? '' : 'paused'} ${jammed ? 'slow' : ''} ${fast ? 'fast' : ''}`} />
        <div className="conveyor-rail top" />
        <div className="conveyor-rail bot" />

        {visible.length === 0 ? (
          <div className="conveyor-empty">
            <span className="conveyor-empty-icon">📭</span>
            <span>Load evidence onto the belt</span>
          </div>
        ) : (
          visible.map((p, i) => {
            const focused = focusId === p.id;
            return (
              <button
                key={p.id}
                className={`conveyor-folder ${p.private ? 'private' : ''} ${p.indexed ? 'indexed' : ''} ${isRunning ? 'moving' : 'parked'} ${focused ? 'focused' : ''}`}
                onClick={() => onFocusChange?.(p.id)}
                style={
                  {
                    '--slide-delay': `${i * 1.1}s`,
                    '--slide-dur': `${fast ? 4 : 6.5 + i * 0.35}s`,
                    '--park-left': `${6 + i * 11}%`,
                  } as React.CSSProperties
                }
                title={p.title}
                type="button"
              >
                <div className="conveyor-folder-body">
                  <div className="conveyor-folder-tape" />
                  <span className="conveyor-folder-title">
                    {p.title.slice(0, 14)}
                    {p.title.length > 14 ? '…' : ''}
                  </span>
                  {p.indexed ? <span className="conveyor-folder-badge">✓</span> : null}
                  {focused ? <span className="conveyor-folder-focus-ring" /> : null}
                </div>
              </button>
            );
          })
        )}

        {jammed ? (
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            className="conveyor-overflow-tag"
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            +{overflow}
          </motion.span>
        ) : null}
      </div>

      <div className="conveyor-belt-foot">
        <span>{footLeft}</span>
        <span className={jammed ? 'text-overflow-amber' : isRunning ? 'text-theme-accent' : ''}>
          {fast ? 'remember()…' : jammed ? 'JAM' : isRunning ? 'Flowing' : 'Idle'}
        </span>
        <span>{footRight}</span>
      </div>
    </div>
  );
}