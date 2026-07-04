import { motion, AnimatePresence } from 'framer-motion';
import type { BeltPacket } from '../ConveyorBelt';

interface FocusFolderCardProps {
  packet?: BeltPacket | null;
  thwack?: boolean;
  beltFast?: boolean;
}

export function FocusFolderCard({ packet, thwack = false, beltFast = false }: FocusFolderCardProps) {
  if (!packet) return null;

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`focus-folder-card ${packet.private ? 'private' : ''} ${packet.indexed ? 'indexed' : ''}`}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        initial={{ opacity: 0, y: 12, scale: 0.94 }}
        key={packet.id}
      >
        <div className="focus-folder-tab" />
        <div className="focus-folder-body">
          <p className="focus-folder-kicker font-hud text-[8px] uppercase tracking-widest text-slate-500">
            Active packet
          </p>
          <h4 className="focus-folder-title">{packet.title}</h4>
          <div className="focus-folder-meta">
            <span className={packet.indexed ? 'text-neon-green' : 'text-neon-orange'}>
              {packet.indexed ? 'In Cognee graph' : beltFast ? 'Indexing…' : 'Awaiting remember()'}
            </span>
            {packet.private ? <span className="focus-folder-private">PRIVATE</span> : null}
          </div>
          <div className="focus-folder-bar">
            <motion.div
              animate={{ width: packet.indexed ? '100%' : beltFast ? '72%' : '28%' }}
              className="focus-folder-bar-fill"
              transition={{ duration: beltFast ? 0.8 : 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence>
          {thwack ? (
            <motion.div
              animate={{ scale: [1.6, 1], opacity: [0, 1, 1, 0.85], rotate: [-12, -8] }}
              className="focus-folder-thwack"
              exit={{ opacity: 0 }}
              initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
              transition={{ duration: 0.45 }}
            >
              THWACK
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}