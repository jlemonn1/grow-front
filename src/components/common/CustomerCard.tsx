import { CustomerCardSummary } from './CustomerCardSummary';
import { CustomerCardDetails } from './CustomerCardDetails';
import type { Customer } from '@/types/models';
import './CustomerCard.css';

interface CustomerCardProps {
  customer: Customer;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export function CustomerCard({ 
  customer, 
  isExpanded = false,
  onToggleExpand,
  onClick, 
  onDelete 
}: CustomerCardProps) {
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  const handleCardClick = () => {
    if (!isExpanded) {
      onClick?.(customer);
    }
  };

  return (
    <div 
      className={`customer-card ${isExpanded ? 'customer-card-expanded' : ''}`}
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
      <CustomerCardSummary
        customer={customer}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {isExpanded && (
        <CustomerCardDetails
          customer={customer}
          onViewDetails={onClick || (() => {})}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
