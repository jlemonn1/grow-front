import { ProductCardSummary } from './ProductCardSummary';
import { ProductCardDetails } from './ProductCardDetails';
import type { Product } from '@/types/models';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  isExpanded = false, 
  onToggleExpand,
  onClick, 
  onDelete 
}: ProductCardProps) {
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  const handleCardClick = () => {
    if (!isExpanded) {
      onClick?.(product);
    }
  };

  return (
    <div 
      className={`product-card ${isExpanded ? 'product-card-expanded' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isExpanded) {
            handleCardClick();
          } else {
            onToggleExpand?.();
          }
        }
      }}
    >
      <ProductCardSummary
        product={product}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {isExpanded && (
        <ProductCardDetails
          product={product}
          onViewDetails={onClick || (() => {})}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
