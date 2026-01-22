import type { SaleItem } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './SaleItemCardDetails.css';

interface SaleItemCardDetailsProps {
  item: SaleItem;
}

export function SaleItemCardDetails({ item }: SaleItemCardDetailsProps) {
  const subtotalBase = item.subtotalBeforeDiscount || (item.grams * item.pricePerGram);
  const hasDiscount = item.discount !== undefined && item.discountType && item.subtotalBeforeDiscount && item.subtotalBeforeDiscount !== item.lineTotal;

  return (
    <div className="sale-item-card-details">
      <div className="sale-item-card-detail-section">
        <div className="sale-item-card-detail-row">
          <span className="sale-item-card-detail-label">Cálculo:</span>
          <span className="sale-item-card-detail-value">
            {item.grams}g × {formatMoney(item.pricePerGram)} = {formatMoney(subtotalBase)}
          </span>
        </div>
        {hasDiscount && (
          <>
            <div className="sale-item-card-detail-row">
              <span className="sale-item-card-detail-label">Descuento:</span>
              <span className="sale-item-card-detail-value sale-item-card-detail-discount">
                {item.discountType === 'PERCENTAGE' 
                  ? `${item.discount}%`
                  : formatMoney(item.discount || 0)}
              </span>
            </div>
            <div className="sale-item-card-detail-row">
              <span className="sale-item-card-detail-label">Total:</span>
              <span className="sale-item-card-detail-value sale-item-card-detail-total">
                {formatMoney(item.lineTotal)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
