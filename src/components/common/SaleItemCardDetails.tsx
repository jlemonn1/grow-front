import type { SaleItem } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';
import './SaleItemCardDetails.css';

interface SaleItemCardDetailsProps {
  item: SaleItem;
}

export function SaleItemCardDetails({ item }: SaleItemCardDetailsProps) {
  const subtotalBase = item.grams * item.pricePerGram;
  const measurementSuffix = getMeasurementShortLabel(item.measurementType ?? 'WEIGHT');

  return (
    <div className="sale-item-card-details">
      <div className="sale-item-card-detail-section">
        <div className="sale-item-card-detail-row">
          <span className="sale-item-card-detail-label">Cálculo:</span>
            <span className="sale-item-card-detail-value">
              {item.grams}{measurementSuffix} × {formatMoney(item.pricePerGram)}/{measurementSuffix} = {formatMoney(subtotalBase)}
            </span>
        </div>
        {/* Descuentos se aplican a nivel total de venta, no por item */}
      </div>
    </div>
  );
}
