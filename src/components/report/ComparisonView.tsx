import { ReactNode } from 'react';
import { formatMoney } from '@/utils/money';
import './ComparisonView.css';

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format?: (value: number) => string;
}

interface ComparisonViewProps {
  title?: string;
  metrics: ComparisonMetric[];
  children?: ReactNode;
}

export function ComparisonView({ title, metrics, children }: ComparisonViewProps) {
  const formatValue = (value: number, format?: (value: number) => string) => {
    if (format) return format(value);
    return formatMoney(value);
  };

  const calculateChange = (current: number, previous: number): { value: number; percentage: number } => {
    if (previous === 0) {
      return { value: current, percentage: current > 0 ? 100 : 0 };
    }
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return { value: change, percentage };
  };

  return (
    <div className="comparison-view">
      {title && <h3 className="comparison-view-title">{title}</h3>}
      <div className="comparison-view-metrics">
        {metrics.map((metric, index) => {
          const change = calculateChange(metric.current, metric.previous);
          const isPositive = change.value >= 0;

          return (
            <div key={index} className="comparison-metric">
              <div className="comparison-metric-label">{metric.label}</div>
              <div className="comparison-metric-values">
                <div className="comparison-metric-current">
                  {formatValue(metric.current, metric.format)}
                </div>
                <div className={`comparison-metric-change ${isPositive ? 'positive' : 'negative'}`}>
                  <span className="comparison-metric-arrow">
                    {isPositive ? '↑' : '↓'}
                  </span>
                  {formatValue(Math.abs(change.value), metric.format)} ({change.percentage.toFixed(1)}%)
                </div>
              </div>
              <div className="comparison-metric-previous">
                Anterior: {formatValue(metric.previous, metric.format)}
              </div>
            </div>
          );
        })}
      </div>
      {children && <div className="comparison-view-content">{children}</div>}
    </div>
  );
}
