import { useNavigate } from 'react-router-dom';
import { StockMovementCardSummary } from './StockMovementCardSummary';
import { StockMovementCardDetails } from './StockMovementCardDetails';
import type { StockMovement } from '@/types/models';
import './StockMovementCard.css';

interface StockMovementCardProps {
  movement: StockMovement;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function StockMovementCard({ 
  movement, 
  isExpanded = false, 
  onToggleExpand
}: StockMovementCardProps) {
  const navigate = useNavigate();

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  const handleCardClick = () => {
    // Solo navegar si tiene un saleId (es una venta)
    if (movement.saleId) {
      navigate(`/sales/${movement.saleId}`);
    }
  };

  const isClickable = !!movement.saleId;

  return (
    <div 
      className={`stock-movement-card ${isExpanded ? 'stock-movement-card-expanded' : ''} ${isClickable ? 'stock-movement-card-clickable' : ''}`}
      onClick={isClickable ? handleCardClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-expanded={isExpanded}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      } : undefined}
    >
      <StockMovementCardSummary
        movement={movement}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {isExpanded && (
        <StockMovementCardDetails
          movement={movement}
        />
      )}
    </div>
  );
}
