import { ReactNode } from 'react';
import './FormCard.css';

interface FormCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  plain?: boolean;
}

export function FormCard({ children, title, className = '', plain = false }: FormCardProps) {
  if (plain) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div className={`form-card ${className}`}>
      {title && <h2 className="form-card-title">{title}</h2>}
      {children}
    </div>
  );
}
