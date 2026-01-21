import { SummaryCardSummary } from './SummaryCardSummary';
import type { SummaryRow } from '@/types/models';
import './SummaryCard.css';

interface SummaryCardProps {
  row: SummaryRow;
  columns: Array<{ header: string; accessor: (row: SummaryRow) => React.ReactNode }>;
}

export function SummaryCard({ row, columns }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <SummaryCardSummary
        row={row}
        columns={columns}
      />
    </div>
  );
}
