import type { SummaryRow } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './SummaryCardSummary.css';

interface SummaryCardSummaryProps {
  row: SummaryRow;
  columns: Array<{ header: string; accessor: (row: SummaryRow) => React.ReactNode }>;
}

export function SummaryCardSummary({ row, columns }: SummaryCardSummaryProps) {
  return (
    <div className="summary-card-summary">
      <div className="summary-card-main-info">
        <div className="summary-card-label">
          {columns[0]?.accessor(row) || row.label}
        </div>
        <div className="summary-card-values">
          {columns.slice(1).map((column, index) => (
            <div key={index} className="summary-card-value-item">
              <span className="summary-card-value-label">{column.header}:</span>
              <span className="summary-card-value-value">{column.accessor(row)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
