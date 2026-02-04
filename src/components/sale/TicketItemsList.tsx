import { useCallback } from 'react';
import { TicketItemRow } from './TicketItemRow';
import { EmptyState } from '@/components/common/EmptyState';
import type { TicketItem } from '@/types/models';
import './TicketItemsList.css';

interface TicketItemsListProps {
  items: TicketItem[];
  onUpdate: (index: number, grams: number) => void;
  onUpdateDiscount: (index: number, discount: number | undefined, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | undefined) => void;
  onRemove: (index: number) => void;
  onValidate: (index: number) => void;
  getProductStock: (productId: string, excludeItemIndex?: number) => number;
}

export function TicketItemsList({
  items,
  onUpdate,
  onUpdateDiscount,
  onRemove,
  onValidate,
  getProductStock,
}: TicketItemsListProps) {
  const handleValidate = useCallback((index: number) => {
    // onValidate debe recalcular el stock internamente antes de validar
    // Solo pasamos el índice para mantener la consistencia
    onValidate(index);
  }, [onValidate]);

  if (items.length === 0) {
    return (
      <div className="ticket-items-list-empty">
        <EmptyState
          message="No hay productos en el ticket. Agrega productos usando el selector de productos"
        />
      </div>
    );
  }

  return (
    <div className="ticket-items-list">
      <div className="ticket-items-list-header">
        <h3 className="ticket-items-list-title">Items ({items.length})</h3>
      </div>
      <div className="ticket-items-list-items">
        {items.map((item, index) => (
          <div key={`${item.productId}-${index}`} data-tour={`ticket-item-${index}`}>
            <TicketItemRow
              item={item}
              index={index}
              onUpdate={onUpdate}
              onUpdateDiscount={onUpdateDiscount}
              onRemove={onRemove}
              onValidate={handleValidate}
              availableStock={getProductStock(item.productId, index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
