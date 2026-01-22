import { Product, Customer } from '@/types/models';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import './GlobalSearchResultItem.css';

interface GlobalSearchResultItemProps {
  type: 'product' | 'customer';
  product?: Product;
  customer?: Customer;
  onViewDetails: () => void;
  onDispense?: () => void;
}

export function GlobalSearchResultItem({
  type,
  product,
  customer,
  onViewDetails,
  onDispense,
}: GlobalSearchResultItemProps) {
  if (type === 'product' && product) {
    return (
      <div className="global-search-result-item" onClick={onViewDetails}>
        <div className="global-search-result-content">
          <div className="global-search-result-header">
            <h3 className="global-search-result-title">{product.name}</h3>
            <span className="global-search-result-badge global-search-result-badge-product">
              Producto
            </span>
          </div>
          <div className="global-search-result-details">
            <div className="global-search-result-detail">
              <span className="global-search-result-label">Precio:</span>
              <span className="global-search-result-value">
                {formatMoney(product.pricePerGram)}/g
              </span>
            </div>
            <div className="global-search-result-detail">
              <span className="global-search-result-label">Stock:</span>
              <span className="global-search-result-value">
                {product.stockGrams.toFixed(2)}g
              </span>
            </div>
          </div>
        </div>
        <div className="global-search-result-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="small"
            onClick={onViewDetails}
            className="global-search-result-button"
          >
            Detalles
          </Button>
          {onDispense && (
            <Button
              variant="primary"
              size="small"
              onClick={onDispense}
              className="global-search-result-button"
            >
              Dispensar
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'customer' && customer) {
    return (
      <div className="global-search-result-item" onClick={onViewDetails}>
        <div className="global-search-result-content">
          <div className="global-search-result-header">
            <h3 className="global-search-result-title">{customer.displayName}</h3>
            <span className="global-search-result-badge global-search-result-badge-customer">
              Cliente
            </span>
          </div>
          <div className="global-search-result-details">
            {customer.pin && (
              <div className="global-search-result-detail">
                <span className="global-search-result-label">PIN:</span>
                <span className="global-search-result-value global-search-result-pin">
                  {customer.pin}
                </span>
              </div>
            )}
            {customer.phone && (
              <div className="global-search-result-detail">
                <span className="global-search-result-label">Teléfono:</span>
                <span className="global-search-result-value">{customer.phone}</span>
              </div>
            )}
          </div>
        </div>
        <div className="global-search-result-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="small"
            onClick={onViewDetails}
            className="global-search-result-button"
          >
            Detalles
          </Button>
          {onDispense && (
            <Button
              variant="primary"
              size="small"
              onClick={onDispense}
              className="global-search-result-button"
            >
              Dispensar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
