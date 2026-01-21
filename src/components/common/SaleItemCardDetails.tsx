import type { SaleItem } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './SaleItemCardDetails.css';

interface SaleItemCardDetailsProps {
  item: SaleItem;
}

export function SaleItemCardDetails({ item }: SaleItemCardDetailsProps) {
  return (
    <div className="sale-item-card-details">
      <div className="sale-item-card-detail-section">
        <div className="sale-item-card-detail-row">
          <span className="sale-item-card-detail-label">Cálculo:</span>
          <span className="sale-item-card-detail-value">
            {item.grams}g × {formatMoney(item.pricePerGram)} = {formatMoney(item.lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
