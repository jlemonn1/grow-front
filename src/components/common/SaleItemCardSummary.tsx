import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { ProductImage } from '@/components/common/ProductImage';
import type { SaleItem } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';
import './SaleItemCardSummary.css';

interface SaleItemCardSummaryProps {
  item: SaleItem;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export function SaleItemCardSummary({ item, isExpanded, onToggleExpand }: SaleItemCardSummaryProps) {
  const measurementSuffix = getMeasurementShortLabel(item.measurementType ?? 'WEIGHT');
  return (
    <div className="sale-item-card-summary">
      {item.imageUrl && (
        <ProductImage 
          imageUrl={item.imageUrl} 
          alt={item.productName}
          size="small"
          className="sale-item-card-image"
        />
      )}
      <div className="sale-item-card-main-info">
        <div className="sale-item-card-header">
          <h3 className="sale-item-card-product-name" title={item.productName}>
            {item.productName}
          </h3>
          <div className="sale-item-card-subtotal">
            <span>{formatMoney(item.lineTotal)}</span>
          </div>
        </div>
        <div className="sale-item-card-stats">
            <div className="sale-item-card-stat">
              <span className="sale-item-card-stat-label">Cantidad:</span>
              <span className="sale-item-card-stat-value">{item.grams}{measurementSuffix}</span>
            </div>
            <div className="sale-item-card-stat">
              <span className="sale-item-card-stat-label">Precio unitario:</span>
              <span className="sale-item-card-stat-value">{formatMoney(item.pricePerGram)}/{measurementSuffix}</span>
            </div>
        </div>
      </div>
      <button
        type="button"
        className="sale-item-card-expand-button"
        onClick={onToggleExpand}
        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <HiChevronUp className="sale-item-card-expand-icon" aria-hidden="true" />
        ) : (
          <HiChevronDown className="sale-item-card-expand-icon" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
