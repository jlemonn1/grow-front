import { SaleHistoryCardSummary } from './SaleHistoryCardSummary';
import { SaleHistoryCardDetails } from './SaleHistoryCardDetails';
import type { CustomerSale } from '@/types/models';
import './SaleHistoryCard.css';

interface SaleHistoryCardProps {
  sale: CustomerSale;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: (sale: CustomerSale) => void;
}

export function SaleHistoryCard({ 
  sale, 
  isExpanded = false, 
  onToggleExpand,
  onClick
}: SaleHistoryCardProps) {
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
      className={`sale-history-card ${isExpanded ? 'sale-history-card-expanded' : ''}`}
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
      <SaleHistoryCardSummary
        sale={sale}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {isExpanded && (
        <SaleHistoryCardDetails
          sale={sale}
        />
      )}
    </div>
  );
}
