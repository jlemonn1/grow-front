import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import type { Customer } from '@/types/models';
import './CustomerCardSummary.css';

interface CustomerCardSummaryProps {
  customer: Customer;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export function CustomerCardSummary({ customer, isExpanded, onToggleExpand }: CustomerCardSummaryProps) {
  return (
    <div className="customer-card-summary">
      <div className="customer-card-main-info">
        <div className="customer-card-header">
          <h3 className="customer-card-name" title={customer.displayName}>
            {customer.displayName}
          </h3>
          {customer.pin && (
            <span className="customer-card-pin-badge" title={`PIN: ${customer.pin}`}>
              PIN: {customer.pin}
            </span>
          )}
          {customer.notes && (
            <span className="customer-card-notes-badge" title="Tiene notas">
              Notas
            </span>
          )}
        </div>
        <div className="customer-card-secondary-info">
          {customer.phone && (
            <div className="customer-card-phone">
              <span className="customer-card-phone-label">Teléfono:</span>
              <span className="customer-card-phone-value">{customer.phone}</span>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="customer-card-expand-button"
        onClick={onToggleExpand}
        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <HiChevronUp className="customer-card-expand-icon" aria-hidden="true" />
        ) : (
          <HiChevronDown className="customer-card-expand-icon" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
