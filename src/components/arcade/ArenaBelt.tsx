import { motion } from 'framer-motion';

interface Packet {
  id: string;
  title: string;
  private?: boolean;
}

interface ArenaBeltProps {
  packets: Packet[];
  running?: boolean;
  label?: string;
}

export function ArenaBelt({ packets, running = true, label = 'Evidence queue' }: ArenaBeltProps) {
  const visible = packets.slice(0, 8);
  const jammed = packets.length > 4;
  const overflow = Math.max(0, packets.length - 4);

  return (
    <div className="arena-belt-wrap">
      <div className="arena-belt-head">
        <span className="font-hud text-[9px] uppercase tracking-widest text-slate-500">{label}</span>
        <span className={`arena-belt-status ${running ? 'live' : 'idle'}`}>
          {running ? '● BELT LIVE' : '○ STANDBY'}
        </span>
      </div>

      <div className={`arena-belt ${jammed ? 'jammed' : ''}`}>
        <div className={`arena-tread ${running ? '' : 'paused'} ${jammed ? 'slow' : ''}`} />
        <div className="arena-rail top" />
        <div className="arena-rail bot" />

        {visible.map((p, i) => (
          <div
            key={p.id}
            className={`arena-folder ${p.private ? 'private' : ''}`}
            style={
              running
                ? {
                    animation: `arenaSlide ${7 + i * 0.4}s linear ${i * 1.2}s infinite`,
                  }
                : undefined
            }
            title={p.title}
          >
            <div className="arena-folder-body">
              <div className="arena-folder-tape" />
              <div className="arena-folder-label" />
              <div className="arena-folder-bars" />
            </div>
          </div>
        ))}

        {jammed ? (
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            className="arena-overflow-tag"
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            +{overflow}
          </motion.span>
        ) : null}
      </div>

      <div className="arena-belt-foot">
        <span>Intake</span>
        <span className={jammed ? 'text-overflow-amber' : ''}>{jammed ? 'JAM — clear backlog' : 'Flowing'}</span>
        <span>Indexed</span>
      </div>
    </div>
  );
}