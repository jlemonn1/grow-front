import { SaleItemCardSummary } from './SaleItemCardSummary';
import { SaleItemCardDetails } from './SaleItemCardDetails';
import type { SaleItem } from '@/types/models';
import './SaleItemCard.css';

interface SaleItemCardProps {
  item: SaleItem;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SaleItemCard({ 
  item, 
  isExpanded = false, 
  onToggleExpand
}: SaleItemCardProps) {
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  return (
    <div 
      className={`sale-item-card ${isExpanded ? 'sale-item-card-expanded' : ''}`}
      role="article"
      aria-expanded={isExpanded}
    >
      <SaleItemCardSummary
        item={item}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {isExpanded && (
        <SaleItemCardDetails
          item={item}
        />
      )}
    </div>
  );
}
