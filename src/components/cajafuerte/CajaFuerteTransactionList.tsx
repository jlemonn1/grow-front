import { memo } from 'react';
import { CajaFuerteTransactionItem } from './CajaFuerteTransactionItem';
import type { CajaFuerteTransaction } from '@/types/models';
import './CajaFuerteTransactionList.css';

interface CajaFuerteTransactionListProps {
  transactions: CajaFuerteTransaction[];
}

function CajaFuerteTransactionListComponent({ transactions }: CajaFuerteTransactionListProps) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="cajafuerte-transaction-list">
      {transactions.map((transaction) => (
        <CajaFuerteTransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}

export const CajaFuerteTransactionList = memo(CajaFuerteTransactionListComponent);
