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
  const isOnSale = product.onSale === true;
  
  // Calcular precio de oferta: si hay porcentaje, calcularlo; si no, usar precio fijo
  let displayPrice = product.pricePerGram;
  let originalPrice: number | null = null;
  
  if (isOnSale) {
    if (product.saleDiscountPercent !== undefined && product.saleDiscountPercent > 0) {
      // Calcular precio con porcentaje de descuento
      displayPrice = product.pricePerGram * (1 - product.saleDiscountPercent / 100);
      originalPrice = product.pricePerGram;
    } else if (product.salePricePerGram !== undefined) {
      // Usar precio fijo de oferta
      displayPrice = product.salePricePerGram;
      originalPrice = product.pricePerGram;
    }
  }

  return (
    <div className={`product-card-summary ${isOnSale ? 'product-card-on-sale' : ''}`}>
      <div className="product-card-main-info">
        <ProductImage 
          imageUrl={product.imageUrl} 
          alt={product.name}
          size="small"
          className="product-card-image"
        />
        <div className="product-card-header">
          <div className="product-card-name-row">
            <h3 className="product-card-name" title={product.name}>
              {product.name}
            </h3>
            {isOnSale && (
              <span className="product-card-sale-badge" title="En oferta">
                OFERTA
              </span>
            )}
          </div>
          {product.category && (
            <span className="product-card-category-badge" title={product.category.name}>
              {product.category.name}
            </span>
          )}
        </div>
        <div className="product-card-stats">
          <div className="product-card-stat">
            <span className="product-card-stat-label">Precio:</span>
            <div className="product-card-price-container">
              {originalPrice && (
                <span className="product-card-price-original">
                  {formatMoney(originalPrice)}
                </span>
              )}
              <span className={`product-card-stat-value ${isOnSale ? 'product-card-price-sale' : ''}`}>
                {formatMoney(displayPrice)}/g
              </span>
            </div>
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
