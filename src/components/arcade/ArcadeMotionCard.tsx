import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ArcadeMotionCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stamp?: boolean;
}

export function ArcadeMotionCard({ children, className = '', delay = 0, stamp }: ArcadeMotionCardProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0, rotate: stamp ? -1 : 0 }}
      className={`arcade-motion-card ${className}`}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      {children}
    </motion.div>
  );
}