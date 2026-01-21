import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import type { StockMovement } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './StockMovementCardSummary.css';

interface StockMovementCardSummaryProps {
  movement: StockMovement;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}

function getMovementTypeLabel(type: string): string {
  switch (type) {
    case 'INITIAL':
      return 'Stock Inicial';
    case 'RECHARGE':
      return 'Recarga';
    case 'SALE_OUT':
      return 'Venta';
    default:
      return type;
  }
}

function getMovementTypeColor(type: string): string {
  switch (type) {
    case 'INITIAL':
      return 'var(--color-success)';
    case 'RECHARGE':
      return 'var(--color-info)';
    case 'SALE_OUT':
      return 'var(--color-error)';
    default:
      return 'var(--text-secondary)';
  }
}

export function StockMovementCardSummary({ movement, isExpanded, onToggleExpand }: StockMovementCardSummaryProps) {
  const deltaFormatted = movement.deltaGrams > 0 
    ? `+${movement.deltaGrams.toFixed(2)}` 
    : movement.deltaGrams.toFixed(2);
  
  const typeLabel = getMovementTypeLabel(movement.type);
  const typeColor = getMovementTypeColor(movement.type);

  return (
    <div className="stock-movement-card-summary">
      <div className="stock-movement-card-main-info">
        <div className="stock-movement-card-header">
          <span 
            className="stock-movement-card-type-badge"
            style={{ color: typeColor, borderColor: typeColor }}
            title={typeLabel}
          >
            {typeLabel}
          </span>
          <span className="stock-movement-card-delta" title={`Delta: ${deltaFormatted}g`}>
            {deltaFormatted}g
          </span>
        </div>
        <div className="stock-movement-card-stats">
          <div className="stock-movement-card-stat">
            <span className="stock-movement-card-stat-label">Stock después:</span>
            <span className="stock-movement-card-stat-value">
              {movement.stockAfterGrams.toFixed(2)}g
            </span>
          </div>
          <div className="stock-movement-card-stat">
            <span className="stock-movement-card-stat-label">Fecha:</span>
            <span className="stock-movement-card-stat-value">
              {formatDateTime(movement.createdAt)}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="stock-movement-card-expand-button"
        onClick={onToggleExpand}
        aria-label={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <HiChevronUp className="stock-movement-card-expand-icon" aria-hidden="true" />
        ) : (
          <HiChevronDown className="stock-movement-card-expand-icon" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
