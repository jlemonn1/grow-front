import { ReactNode } from 'react';
import './FormCard.css';

interface FormCardProps {
  children: ReactNode;
  className?: string;
}

export function FormCard({ children, className = '' }: FormCardProps) {
  return (
    <div className={`form-card ${className}`}>
      {children}
    </div>
  );
}
