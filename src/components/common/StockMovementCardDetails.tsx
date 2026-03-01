import type { StockMovement } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './StockMovementCardDetails.css';

interface StockMovementCardDetailsProps {
  movement: StockMovement;
}

function getMovementTypeLabel(type: string): string {
  switch (type) {
    case 'INITIAL':
      return 'Stock Inicial';
    case 'RECHARGE':
      return 'Recarga';
    case 'SALE_OUT':
      return 'Dispensación';
    default:
      return type;
  }
}

export function StockMovementCardDetails({ movement }: StockMovementCardDetailsProps) {
  const deltaFormatted = movement.deltaGrams > 0 
    ? `+${movement.deltaGrams.toFixed(2)}` 
    : movement.deltaGrams.toFixed(2);

  return (
    <div className="stock-movement-card-details">
      <div className="stock-movement-card-detail-section">
        <span className="stock-movement-card-detail-label">Tipo:</span>
        <span className="stock-movement-card-detail-value">
          {getMovementTypeLabel(movement.type)}
        </span>
      </div>
      
      <div className="stock-movement-card-detail-section">
        <span className="stock-movement-card-detail-label">Delta (g):</span>
        <span className="stock-movement-card-detail-value">{deltaFormatted}</span>
      </div>

      <div className="stock-movement-card-detail-section">
        <span className="stock-movement-card-detail-label">Stock Antes:</span>
        <span className="stock-movement-card-detail-value">
          {movement.stockBeforeGrams.toFixed(2)}g
        </span>
      </div>

      <div className="stock-movement-card-detail-section">
        <span className="stock-movement-card-detail-label">Stock Después:</span>
        <span className="stock-movement-card-detail-value">
          {movement.stockAfterGrams.toFixed(2)}g
        </span>
      </div>

      {movement.note && (
        <div className="stock-movement-card-detail-section">
          <span className="stock-movement-card-detail-label">Nota:</span>
          <p className="stock-movement-card-detail-value">{movement.note}</p>
        </div>
      )}

      <div className="stock-movement-card-detail-section">
        <span className="stock-movement-card-detail-label">Fecha:</span>
        <span className="stock-movement-card-detail-value">
          {formatDateTime(movement.createdAt)}
        </span>
      </div>

      {movement.saleId && (
        <div className="stock-movement-card-detail-section">
          <span className="stock-movement-card-detail-label">ID Venta:</span>
          <span className="stock-movement-card-detail-value">{movement.saleId}</span>
        </div>
      )}

      {(movement.createdByUsername || movement.createdBy?.username) && (
        <div className="stock-movement-card-detail-section">
          <span className="stock-movement-card-detail-label">Realizado por:</span>
          <span className="stock-movement-card-detail-value">
            {movement.createdByUsername || movement.createdBy?.username}
          </span>
        </div>
      )}
    </div>
  );
}
