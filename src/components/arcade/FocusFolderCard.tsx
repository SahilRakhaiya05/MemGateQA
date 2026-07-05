import { motion } from 'framer-motion';
import type { BeltPacket } from '../ConveyorBelt';

interface FocusFolderCardProps {
  packet?: BeltPacket | null;
  thwack?: boolean;
  beltFast?: boolean;
  reading?: boolean;
}

export function FocusFolderCard({ packet, thwack = false, beltFast = false, reading = false }: FocusFolderCardProps) {
  if (!packet) return null;

  const statusLabel = packet.indexed
    ? 'In Cognee graph'
    : reading
      ? 'Reading memory…'
      : beltFast
        ? 'Indexing…'
        : 'Awaiting remember()';

  const barWidth = packet.indexed ? '100%' : beltFast ? '72%' : reading ? '45%' : '28%';

  return (
    <motion.div
      className={`focus-folder-card ${packet.private ? 'private' : ''} ${packet.indexed ? 'indexed' : ''}`}
      layout={false}
    >
      <div className="focus-folder-tab" />
      <div className="focus-folder-body">
        <p className="focus-folder-kicker font-hud text-[8px] uppercase tracking-widest text-slate-500">
          Memory box
        </p>
        <p className="focus-folder-id font-hud text-[8px] uppercase tracking-wider text-slate-600">{packet.id}</p>
        <h4 className="focus-folder-title">{packet.title}</h4>
        <div className="focus-folder-meta">
          <span className={packet.indexed ? 'text-neon-green' : reading ? 'text-cyan-300' : 'text-neon-orange'}>
            {statusLabel}
          </span>
          {packet.private ? <span className="focus-folder-private">PRIVATE</span> : null}
        </div>
        <div className="focus-folder-bar">
          <motion.div
            animate={{ width: barWidth }}
            className="focus-folder-bar-fill"
            layout={false}
            transition={{ duration: beltFast ? 0.8 : 0.35 }}
          />
        </div>
      </div>

      {thwack ? (
        <motion.div
          animate={{ scale: [1.4, 1], opacity: [0, 1, 0.9], rotate: [-10, -6] }}
          className="focus-folder-thwack"
          initial={{ scale: 1.8, opacity: 0, rotate: -14 }}
          transition={{ duration: 0.4 }}
        >
          THWACK
        </motion.div>
      ) : null}
    </motion.div>
  );
}