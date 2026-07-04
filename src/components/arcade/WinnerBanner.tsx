import { motion, AnimatePresence } from 'framer-motion';

interface WinnerBannerProps {
  show: boolean;
  score: number;
  title?: string;
}

export function WinnerBanner({ show, score, title = 'SHIP CLEAR' }: WinnerBannerProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="winner-banner"
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          initial={{ opacity: 0, y: -30, scale: 0.85 }}
        >
          <span className="winner-crown">👑</span>
          <div>
            <span className="winner-title">{title}</span>
            <span className="winner-score">Health {score}% · Deploy gate cleared</span>
          </div>
          <motion.span
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            className="winner-sparkle"
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}