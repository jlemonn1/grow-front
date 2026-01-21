import { ReactNode, ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      <span className={loading ? 'btn-content-loading' : ''}>{children}</span>
    </button>
  );
}
