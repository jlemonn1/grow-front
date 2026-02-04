import { SaleCardSummary } from './SaleCardSummary';
import { SaleCardDetails } from './SaleCardDetails';
import type { Sale } from '@/types/models';
import './SaleCard.css';

interface SaleCardProps {
  sale: Sale;
  customerName: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: (sale: Sale) => void;
}

export function SaleCard({ 
  sale, 
  customerName,
  isExpanded = false, 
  onToggleExpand,
  onClick
}: SaleCardProps) {
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  const handleCardClick = () => {
    if (!isExpanded) {
      onClick?.(sale);
    }
  };

  return (
    <div 
      className={`sale-card ${isExpanded ? 'sale-card-expanded' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      data-tour={`sale-row-${sale.id}`}
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
      <SaleCardSummary
        sale={sale}
        customerName={customerName}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {isExpanded && (
        <SaleCardDetails
          sale={sale}
          customerId={sale.customerId}
        />
      )}
    </div>
  );
}
