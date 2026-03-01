import { memo, useCallback } from 'react';
import { ProductImage } from '@/components/common/ProductImage';
import type { Product } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';

interface ProductPickerCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
}

const ProductPickerCardComponent = ({ product, isSelected, onSelect }: ProductPickerCardProps) => {
  const handleClick = useCallback(() => {
    if (product.stockGrams > 0) {
      onSelect(product);
    }
  }, [product, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && product.stockGrams > 0) {
      e.preventDefault();
      onSelect(product);
    }
  }, [product, onSelect]);

  const measurementSuffix = getMeasurementShortLabel(product.measurementType);
  const isOutOfStock = product.stockGrams <= 0;

  return (
    <div
      className={`product-picker-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isOutOfStock}
      tabIndex={0}
    >
      <div className="product-picker-card-image-wrapper">
        <ProductImage
          imageUrl={product.imageUrl}
          alt={product.name}
          size="medium"
          className="product-picker-card-image"
        />
        {isOutOfStock && (
          <div className="product-picker-card-out-of-stock-badge">Sin stock</div>
        )}
      </div>
      <div className="product-picker-card-info">
        <div className="product-picker-card-name" title={product.name}>
          {product.name}
        </div>
        <div className="product-picker-card-details">
          <div className="product-picker-card-price">
            {formatMoney(product.pricePerGram)}/{measurementSuffix}
          </div>
          <div className={`product-picker-card-stock ${isOutOfStock ? 'stock-zero' : ''}`}>
            {product.stockGrams}{measurementSuffix}
          </div>
        </div>
      </div>
    </div>
  );
};

ProductPickerCardComponent.displayName = 'ProductPickerCardComponent';

export const ProductPickerCard = memo(ProductPickerCardComponent);
