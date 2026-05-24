import { memo, useCallback } from 'react';
import { ProductImage } from '@/components/common/ProductImage';
import type { Product } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';

interface ProductPickerListProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
}

const ProductPickerListComponent = ({ products, selectedProduct, onSelect }: ProductPickerListProps) => {
  return (
    <ul className="product-picker-list" role="listbox">
      {products.map((product) => (
        <ProductPickerListItem
          key={product.id}
          product={product}
          isSelected={selectedProduct?.id === product.id}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
};

interface ProductPickerListItemProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
}

const ProductPickerListItem = ({ product, isSelected, onSelect }: ProductPickerListItemProps) => {
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
    <li
      className={`product-picker-item ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isOutOfStock}
      tabIndex={0}
    >
      <ProductImage
        imageUrl={product.imageUrl}
        alt={product.name}
        size="small"
        className="product-picker-item-image"
      />
      <div className="product-picker-item-info">
        <div className="product-picker-item-name" title={product.name}>
          {product.name}
        </div>
        <div className="product-picker-item-details">
          <span className="product-picker-item-price">
            {formatMoney(product.pricePerGram)}/{measurementSuffix}
          </span>
          <span className={`product-picker-stock ${isOutOfStock ? 'stock-zero' : ''}`}>
            {isOutOfStock ? 'Sin stock' : `${product.stockGrams}${measurementSuffix}`}
          </span>
        </div>
      </div>
    </li>
  );
};

ProductPickerListComponent.displayName = 'ProductPickerListComponent';

export const ProductPickerList = memo(ProductPickerListComponent);
