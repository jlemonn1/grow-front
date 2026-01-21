import { ReactNode } from 'react';
import './FormCard.css';

interface FormCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function FormCard({ children, title, className = '' }: FormCardProps) {
  return (
    <div className={`form-card ${className}`}>
      {title && <h2 className="form-card-title">{title}</h2>}
      {children}
    </div>
  );
}
