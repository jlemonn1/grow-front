import { ReactNode } from 'react';
import './KpiCard.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <div className="kpi-card">
      {icon && <div className="kpi-card-icon">{icon}</div>}
      <div className="kpi-card-content">
        <h3 className="kpi-card-title">{title}</h3>
        <div className="kpi-card-value">{value}</div>
        {subtitle && <div className="kpi-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
