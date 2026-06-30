import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'danger' | 'success' | 'ghost';

interface OcButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<Variant, string> = {
  primary: 'oc-btn-primary',
  danger: 'oc-btn-danger',
  success: 'oc-btn-success',
  ghost: 'oc-btn-ghost',
};

export function OcButton({ children, variant = 'primary', size = 'md', className = '', ...rest }: OcButtonProps) {
  return (
    <button
      className={`oc-btn ${variants[variant]} oc-btn-${size} ${className}`}
      type="button"
      {...rest}
    >
      <span className="oc-btn-face">{children}</span>
    </button>
  );
}