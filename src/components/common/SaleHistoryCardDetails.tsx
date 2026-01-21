import { Link } from 'react-router-dom';
import { Button } from './Button';
import type { CustomerSale } from '@/types/models';
import './SaleHistoryCardDetails.css';

interface SaleHistoryCardDetailsProps {
  sale: CustomerSale;
}

export function SaleHistoryCardDetails({ sale }: SaleHistoryCardDetailsProps) {
  return (
    <div className="sale-history-card-details">
      <div className="sale-history-card-actions">
        <Link
          to={`/sales/${sale.id}`}
          className="sale-history-card-link"
        >
          <Button
            variant="primary"
            className="sale-history-card-action-button"
          >
            Ver detalle
          </Button>
        </Link>
      </div>
    </div>
  );
}
