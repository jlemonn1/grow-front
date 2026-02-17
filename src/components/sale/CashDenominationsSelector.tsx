import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import { useUI } from '@/context/ui.context';
import { HiExclamationTriangle } from 'react-icons/hi2';
import './CashDenominationsSelector.css';

interface CashDenominationsSelectorProps {
  changeAmount: number;
  onConfirmChange?: () => void;
  disabled?: boolean;
}

export function CashDenominationsSelector({
  changeAmount,
  onConfirmChange,
  disabled = false,
}: CashDenominationsSelectorProps) {
  const { showToast } = useUI();
  const [confirmed, setConfirmed] = useState(false);

  // Reset confirmation when change amount changes
  useEffect(() => {
    setConfirmed(false);
  }, [changeAmount]);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirmChange?.();
    showToast('Cambio confirmado', 'success');
  };

  if (changeAmount <= 0) {
    return null;
  }

  return (
    <div className="cash-denominations-selector">
      <div className="cash-denominations-section">
        <div className="cash-denominations-section-header">
          <h4 className="cash-denominations-section-title">
            Cambio a entregar: {formatMoney(changeAmount)}
          </h4>
        </div>

        <div className="cash-denominations-info">
          <HiExclamationTriangle />
          <p>
            Entregar <strong>{formatMoney(changeAmount)}</strong> en cambio al cliente.
          </p>
        </div>

        {onConfirmChange && !confirmed && (
          <Button
            type="button"
            variant="primary"
            size="small"
            onClick={handleConfirm}
            disabled={disabled}
          >
            Confirmar cambio entregado
          </Button>
        )}

        {confirmed && (
          <div className="cash-denominations-confirmed">
            ✓ Cambio confirmado
          </div>
        )}
      </div>
    </div>
  );
}
