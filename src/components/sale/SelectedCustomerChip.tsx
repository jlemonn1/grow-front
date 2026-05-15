import { HiX } from 'react-icons/hi';
import { CustomerAvatar } from '@/components/common/CustomerAvatar';
import { formatMoney } from '@/utils/money';
import type { Customer } from '@/types/models';
import './SelectedCustomerChip.css';

interface SelectedCustomerChipProps {
  customer: Customer;
  onClear: () => void;
}

export function SelectedCustomerChip({ customer, onClear }: SelectedCustomerChipProps) {
  return (
    <div className="selected-customer-chip">
      <CustomerAvatar
        name={customer.displayName}
        imageUrl={customer.profilePictureUrl}
        size={28}
        className="selected-customer-chip-avatar"
      />
      <div className="selected-customer-chip-info">
        <span className="selected-customer-chip-name" title={customer.displayName}>
          {customer.displayName}
        </span>
        {customer.balance !== undefined && (
          <span className="selected-customer-chip-balance">
            {formatMoney(customer.balance)}
          </span>
        )}
      </div>
      <button
        type="button"
        className="selected-customer-chip-clear"
        onClick={onClear}
        aria-label="Borrar selección y reiniciar"
        title="Borrar selección y reiniciar"
      >
        <HiX />
      </button>
    </div>
  );
}
