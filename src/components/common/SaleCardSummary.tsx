import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import type { Sale } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './SaleCardSummary.css';

interface SaleCardSummaryProps {
  sale: Sale;
  customerName: string;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export function SaleCardSummary({ sale, customerName, isExpanded, onToggleExpand }: SaleCardSummaryProps) {
  const getStatusClass = (status: string) => {
    return `sale-card-status sale-card-status-${status.toLowerCase()}`;
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="sale-card-summary">
      <div className="sale-card-main-info">
        <div className="sale-card-header">
          <div className="sale-card-id-section">
            <span className="sale-card-id-label">ID:</span>
            <span className="sale-card-id-value">{sale.id.substring(0, 8)}...</span>
          </div>
          <span className={getStatusClass(sale.status)}>
            {getStatusLabel(sale.status)}
          </span>
        </div>
        <div className="sale-card-customer">
          <span className="sale-card-customer-label">Cliente:</span>
          <span className="sale-card-customer-value">{customerName}</span>
        </div>
        <div className="sale-card-stats">
          <div className="sale-card-stat">
            <span className="sale-card-stat-label">Fecha:</span>
            <span className="sale-card-stat-value">{formatDateTime(sale.createdAt)}</span>
          </div>
          <div className="sale-card-stat">
            <span className="sale-card-stat-label">Items:</span>
            <span className="sale-card-stat-value">{sale.items?.length || 0}</span>
          </div>
        </div>
        <div className="sale-card-total">
          <span className="sale-card-total-label">Total:</span>
          <span className="sale-card-total-value">{formatMoney(sale.totalAmount)}</span>
        </div>
      </div>
      <button
        type="button"
        className="sale-card-expand-button"
        onClick={onToggleExpand}
        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <HiChevronUp className="sale-card-expand-icon" aria-hidden="true" />
        ) : (
          <HiChevronDown className="sale-card-expand-icon" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
