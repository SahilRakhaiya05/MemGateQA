import { motion } from 'framer-motion';

interface GoButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  size?: 'md' | 'lg';
}

export function GoButton({ onClick, disabled, loading, label = 'Run Gate', size = 'lg' }: GoButtonProps) {
  return (
    <motion.button
      className={`go-button ${size}`}
      disabled={disabled || loading}
      onClick={onClick}
      type="button"
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97, y: 2 }}
    >
      <span className="go-button-face">
        <span className="go-button-glow" />
        {loading ? '…' : label}
      </span>
      <span className="go-button-shadow" />
    </motion.button>
  );
}