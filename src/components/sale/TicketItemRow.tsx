import { memo, useCallback } from 'react';
import { NumberInput } from '@/components/forms/NumberInput';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { formatMoney } from '@/utils/money';
import type { TicketItem } from '@/types/models';
import './TicketItemRow.css';

interface TicketItemRowProps {
  item: TicketItem;
  index: number;
  onUpdate: (index: number, grams: number) => void;
  onRemove: (index: number) => void;
  onValidate: (index: number) => void;
  availableStock: number;
}

function TicketItemRowComponent({
  item,
  index,
  onUpdate,
  onRemove,
  onValidate,
  availableStock,
}: TicketItemRowProps) {
  const handleGramsChange = useCallback((grams: number) => {
    onUpdate(index, grams);
    // Validar inmediatamente - onValidate recalculará el stock internamente
    onValidate(index);
  }, [index, onUpdate, onValidate]);

  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  const isInvalid = item.validationState === 'invalid';
  const isChecking = item.validationState === 'checking';

  return (
    <div className={`ticket-item-row ${isInvalid ? 'ticket-item-row-invalid' : ''} ${isChecking ? 'ticket-item-row-checking' : ''}`}>
      <div className="ticket-item-row-content">
        <div className="ticket-item-row-top">
          {item.product?.imageUrl && (
            <ProductImage 
              imageUrl={item.product.imageUrl} 
              alt={item.product?.name || 'Producto'}
              size="small"
              className="ticket-item-row-image"
            />
          )}
          <div className="ticket-item-row-product">
            <div className="ticket-item-row-product-name">
              {item.product?.name || 'Producto desconocido'}
            </div>
            <div className="ticket-item-row-product-price">
              {formatMoney(item.pricePerGram)}/g
            </div>
          </div>

          <div className="ticket-item-row-subtotal">
            <div className="ticket-item-row-subtotal-label">Subtotal</div>
            <div className="ticket-item-row-subtotal-value">
              {formatMoney(item.subtotal)}
            </div>
          </div>

          <div className="ticket-item-row-actions">
            <Button
              variant="danger"
              onClick={handleRemove}
              className="ticket-item-row-remove"
              aria-label="Eliminar producto"
            >
              ×
            </Button>
          </div>
        </div>

        <div className="ticket-item-row-bottom">
          <div className="ticket-item-row-grams">
            <NumberInput
              value={item.grams}
              onChange={handleGramsChange}
              min={0.01}
              step={0.01}
              placeholder="Gramos"
              error={isInvalid ? item.errorMessage : undefined}
              className="ticket-item-row-grams-input"
            />
            <div className="ticket-item-row-stock-info">
              Disponible: {availableStock.toFixed(2)}g
            </div>
          </div>
        </div>
      </div>

      {isInvalid && item.errorMessage && (
        <div className="ticket-item-row-error">
          {item.errorMessage}
        </div>
      )}
    </div>
  );
}

export const TicketItemRow = memo(TicketItemRowComponent, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.item.productId === nextProps.item.productId &&
    prevProps.item.grams === nextProps.item.grams &&
    prevProps.item.subtotal === nextProps.item.subtotal &&
    prevProps.item.validationState === nextProps.item.validationState &&
    prevProps.item.errorMessage === nextProps.item.errorMessage &&
    prevProps.index === nextProps.index &&
    prevProps.availableStock === nextProps.availableStock &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onValidate === nextProps.onValidate
  );
});
