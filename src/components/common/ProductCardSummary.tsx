import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { ProductImage } from '@/components/common/ProductImage';
import type { Product } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './ProductCardSummary.css';

interface ProductCardSummaryProps {
  product: Product;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export function ProductCardSummary({ product, isExpanded, onToggleExpand }: ProductCardSummaryProps) {
  return (
    <div className="product-card-summary">
      <div className="product-card-main-info">
        <ProductImage 
          imageUrl={product.imageUrl} 
          alt={product.name}
          size="small"
          className="product-card-image"
        />
        <div className="product-card-header">
          <h3 className="product-card-name" title={product.name}>
            {product.name}
          </h3>
          {product.category && (
            <span className="product-card-category-badge" title={product.category.name}>
              {product.category.name}
            </span>
          )}
        </div>
        <div className="product-card-stats">
          <div className="product-card-stat">
            <span className="product-card-stat-label">Precio:</span>
            <span className="product-card-stat-value">{formatMoney(product.pricePerGram)}/g</span>
          </div>
          <div className="product-card-stat">
            <span className="product-card-stat-label">Stock:</span>
            <span className="product-card-stat-value">{product.stockGrams.toFixed(2)}g</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="product-card-expand-button"
        onClick={onToggleExpand}
        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <HiChevronUp className="product-card-expand-icon" aria-hidden="true" />
        ) : (
          <HiChevronDown className="product-card-expand-icon" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
