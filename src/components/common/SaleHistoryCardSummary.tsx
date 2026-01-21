import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import type { CustomerSale } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './SaleHistoryCardSummary.css';

interface SaleHistoryCardSummaryProps {
  sale: CustomerSale;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export function SaleHistoryCardSummary({ sale, isExpanded, onToggleExpand }: SaleHistoryCardSummaryProps) {
  const getStatusClass = (status: string) => {
    return `sale-status sale-status-${status.toLowerCase()}`;
  };

  return (
    <div className="sale-history-card-summary">
      <div className="sale-history-card-main-info">
        <div className="sale-history-card-header">
          <div className="sale-history-card-date">
            <span className="sale-history-card-date-label">Fecha:</span>
            <span className="sale-history-card-date-value">{formatDateTime(sale.createdAt)}</span>
          </div>
          <span className={getStatusClass(sale.status)}>
            {sale.status}
          </span>
        </div>
        <div className="sale-history-card-total">
          <span className="sale-history-card-total-label">Total:</span>
          <span className="sale-history-card-total-value">{formatMoney(sale.totalAmount)}</span>
        </div>
      </div>
      <button
        type="button"
        className="sale-history-card-expand-button"
        onClick={onToggleExpand}
        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <HiChevronUp className="sale-history-card-expand-icon" aria-hidden="true" />
        ) : (
          <HiChevronDown className="sale-history-card-expand-icon" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
