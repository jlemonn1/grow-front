import { Link } from 'react-router-dom';
import { Button } from './Button';
import type { Sale } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './SaleCardDetails.css';

interface SaleCardDetailsProps {
  sale: Sale;
  customerId: string;
}

export function SaleCardDetails({ sale, customerId }: SaleCardDetailsProps) {
  return (
    <div className="sale-card-details">
      <div className="sale-card-detail-section">
        <div className="sale-card-detail-row">
          <span className="sale-card-detail-label">Efectivo recibido:</span>
          <span className="sale-card-detail-value">{formatMoney(sale.cashGiven)}</span>
        </div>
        <div className="sale-card-detail-row">
          <span className="sale-card-detail-label">Cambio:</span>
          <span className="sale-card-detail-value">{formatMoney(sale.changeAmount)}</span>
        </div>
      </div>
      <div className="sale-card-actions">
        <Link
          to={`/sales/${sale.id}`}
          className="sale-card-link"
        >
          <Button
            variant="primary"
            className="sale-card-action-button"
          >
            Ver detalle
          </Button>
        </Link>
        <Link
          to={`/customers/${customerId}`}
          className="sale-card-link"
        >
          <Button
            variant="secondary"
            className="sale-card-action-button"
          >
            Ver cliente
          </Button>
        </Link>
      </div>
    </div>
  );
}
