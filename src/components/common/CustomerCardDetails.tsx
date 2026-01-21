import { Button } from './Button';
import type { Customer } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './CustomerCardDetails.css';

interface CustomerCardDetailsProps {
  customer: Customer;
  onViewDetails: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export function CustomerCardDetails({ customer, onViewDetails, onDelete }: CustomerCardDetailsProps) {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(customer);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(customer);
  };

  return (
    <div className="customer-card-details">
      {customer.pin && (
        <div className="customer-card-detail-section">
          <span className="customer-card-detail-label">PIN:</span>
          <span className="customer-card-detail-value customer-card-pin-value">{customer.pin}</span>
        </div>
      )}
      {customer.notes && (
        <div className="customer-card-detail-section">
          <span className="customer-card-detail-label">Notas:</span>
          <p className="customer-card-detail-value">{customer.notes}</p>
        </div>
      )}
      {customer.createdAt && (
        <div className="customer-card-detail-section">
          <span className="customer-card-detail-label">Fecha creación:</span>
          <span className="customer-card-detail-value">{formatDateTime(customer.createdAt)}</span>
        </div>
      )}
      <div className="customer-card-actions">
        <Button
          variant="primary"
          onClick={handleViewDetails}
          className="customer-card-action-button"
        >
          Ver detalles
        </Button>
        {onDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            className="customer-card-action-button"
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
