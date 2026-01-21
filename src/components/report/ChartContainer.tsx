import { ReactNode } from 'react';
import './ChartContainer.css';

interface ChartContainerProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({ title, children, className = '' }: ChartContainerProps) {
  return (
    <div className={`chart-container ${className}`}>
      {title && <h3 className="chart-container-title">{title}</h3>}
      <div className="chart-container-content">
        {children}
      </div>
    </div>
  );
}
