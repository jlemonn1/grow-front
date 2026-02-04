import { memo } from 'react';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import { getDenominationLabel } from '@/utils/denominations';
import type { CajaFuerteTransaction, CajaFuerteTransactionType } from '@/types/models';
import './CajaFuerteTransactionItem.css';

interface CajaFuerteTransactionItemProps {
  transaction: CajaFuerteTransaction;
}

const getTransactionTypeLabel = (type: CajaFuerteTransactionType): string => {
  switch (type) {
    case 'ADD':
      return 'Añadir';
    case 'WITHDRAW':
      return 'Retirar';
    case 'CHANGE':
      return 'Cambio';
    case 'SALE_INPUT':
      return 'Entrada por venta';
    case 'SALE_OUTPUT':
      return 'Salida por cambio';
    default:
      return type;
  }
};

const getTransactionTypeColor = (type: CajaFuerteTransactionType): string => {
  switch (type) {
    case 'ADD':
    case 'SALE_INPUT':
      return 'positive';
    case 'WITHDRAW':
    case 'SALE_OUTPUT':
      return 'negative';
    case 'CHANGE':
      return 'neutral';
    default:
      return 'neutral';
  }
};

const formatDenominations = (denominations: Record<string, number>): string => {
  const items = Object.entries(denominations)
    .filter(([_, qty]) => qty !== 0)
    .map(([value, qty]) => {
      const val = parseFloat(value);
      return `${qty}x ${getDenominationLabel(val)}`;
    });
  return items.length > 0 ? items.join(', ') : '-';
};

function CajaFuerteTransactionItemComponent({ transaction }: CajaFuerteTransactionItemProps) {
  const typeColor = getTransactionTypeColor(transaction.type);
  const isPositive = transaction.amount >= 0;
  const hasDenominations = transaction.denominations && Object.keys(transaction.denominations).length > 0;
  const hasNotes = transaction.notes && transaction.notes.trim().length > 0;
  const hasCreatedBy = transaction.createdByUsername && transaction.createdByUsername.trim().length > 0;

  return (
    <div className="cajafuerte-transaction-item">
      <div className="cajafuerte-transaction-main">
        <div className="cajafuerte-transaction-header">
          <div className="cajafuerte-transaction-type-badge" data-type={typeColor}>
            {getTransactionTypeLabel(transaction.type)}
          </div>
          <div className={`cajafuerte-transaction-amount ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{formatMoney(transaction.amount)}
          </div>
        </div>

        <div className="cajafuerte-transaction-meta">
          <span className="cajafuerte-transaction-date">
            {transaction.createdAt ? formatDateTime(transaction.createdAt) : '-'}
          </span>
          {hasCreatedBy && (
            <span className="cajafuerte-transaction-user">
              {transaction.createdByUsername}
            </span>
          )}
        </div>
      </div>

      {(hasDenominations || hasNotes) && (
        <div className="cajafuerte-transaction-details">
          {hasDenominations && (
            <div className="cajafuerte-transaction-detail-row">
              <span className="cajafuerte-transaction-detail-label">Denominaciones:</span>
              <span className="cajafuerte-transaction-detail-value">
                {formatDenominations(transaction.denominations)}
              </span>
            </div>
          )}

          {hasNotes && (
            <div className="cajafuerte-transaction-detail-row">
              <span className="cajafuerte-transaction-detail-label">Notas:</span>
              <span className="cajafuerte-transaction-detail-value">{transaction.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const CajaFuerteTransactionItem = memo(CajaFuerteTransactionItemComponent);
