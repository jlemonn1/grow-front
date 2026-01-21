import { Button } from './Button';
import type { Product } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './ProductCardDetails.css';

interface ProductCardDetailsProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

export function ProductCardDetails({ product, onViewDetails, onDelete }: ProductCardDetailsProps) {
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(product);
  };

  return (
    <div className="product-card-details">
      {product.description && (
        <div className="product-card-detail-section">
          <span className="product-card-detail-label">Descripción:</span>
          <p className="product-card-detail-value">{product.description}</p>
        </div>
      )}
      {product.createdAt && (
        <div className="product-card-detail-section">
          <span className="product-card-detail-label">Fecha creación:</span>
          <span className="product-card-detail-value">{formatDateTime(product.createdAt)}</span>
        </div>
      )}
      <div className="product-card-actions">
        <Button
          variant="primary"
          onClick={handleViewDetails}
          className="product-card-action-button"
        >
          Ver detalles
        </Button>
        {onDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            className="product-card-action-button"
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
