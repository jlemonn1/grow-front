import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { CashBillButtons } from './CashBillButtons';
import { formatMoney } from '@/utils/money';
import { useConfig } from '@/context/config.context';
import type { TicketItem } from '@/types/models';
import './TicketSummary.css';

interface TicketSummaryProps {
  customerName: string | null;
  items: TicketItem[];
  total: number;
  cashGiven: number;
  change: number;
  isValid: boolean;
  isProcessing: boolean;
  onCashGivenChange: (amount: number) => void;
  onProcessSale: () => void;
  cashGivenError?: string;
}

function TicketSummaryComponent({
  customerName,
  items,
  total,
  cashGiven,
  change,
  isValid,
  isProcessing,
  onCashGivenChange,
  onProcessSale,
  cashGivenError,
}: TicketSummaryProps) {
  const { config } = useConfig();
  const showCashDetails = config?.showCashDetails ?? true;
  const [localCashGiven, setLocalCashGiven] = useState(cashGiven);

  // Sincronizar el estado local cuando cashGiven cambia externamente (por ejemplo, al resetear)
  useEffect(() => {
    setLocalCashGiven(cashGiven);
  }, [cashGiven]);

  const handleCashGivenChange = useCallback((value: number) => {
    setLocalCashGiven(value);
    onCashGivenChange(value);
  }, [onCashGivenChange]);

  const handleAddAmount = useCallback((amount: number) => {
    const newValue = (localCashGiven || 0) + amount;
    setLocalCashGiven(newValue);
    onCashGivenChange(newValue);
  }, [localCashGiven, onCashGivenChange]);

  const hasItems = useMemo(() => items.length > 0, [items.length]);
  const hasInvalidItems = useMemo(
    () => items.some(item => item.validationState === 'invalid'),
    [items]
  );
  const cashInsufficient = useMemo(
    () => cashGiven > 0 && cashGiven < total,
    [cashGiven, total]
  );

  return (
    <div className="ticket-summary" role="region" aria-label="Resumen del ticket">
      <h3 className="ticket-summary-title">Resumen del Ticket</h3>
      
      <div className="ticket-summary-content" aria-live="polite" aria-atomic="true">
        <div className="ticket-summary-row">
          <span>Cliente:</span>
          <span className={!customerName ? 'ticket-summary-missing' : ''}>
            {customerName || 'No seleccionado'}
          </span>
        </div>

        <div className="ticket-summary-row">
          <span>Productos:</span>
          <span className={!hasItems ? 'ticket-summary-missing' : ''}>
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {hasItems && (
          <>
            {hasInvalidItems && (
              <div className="ticket-summary-error">
                ⚠️ Hay productos con errores de validación. Revisa las líneas del ticket.
              </div>
            )}

            <div className="ticket-summary-divider" />

            <div className="ticket-summary-row ticket-summary-total">
              <span>Total:</span>
              <span>{formatMoney(total)}</span>
            </div>

            <div className="ticket-summary-cash-input">
              <CashBillButtons onAddAmount={handleAddAmount} />
              <NumberInput
                label="Efectivo recibido"
                value={localCashGiven}
                onChange={handleCashGivenChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValid && !isProcessing) {
                    e.preventDefault();
                    onProcessSale();
                  }
                }}
                min={0}
                step={0.01}
                error={cashGivenError}
                placeholder="0.00"
                required
              />
            </div>

            {showCashDetails && cashGiven > 0 && (
              <>
                <div className="ticket-summary-row ticket-summary-change">
                  <span>Cambio:</span>
                  <span>{formatMoney(change)}</span>
                </div>

                {cashInsufficient && (
                  <div className="ticket-summary-error">
                    ⚠️ El efectivo debe ser mayor o igual al total
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!hasItems && (
          <div className="ticket-summary-empty">
            Agrega productos al ticket para ver el resumen
          </div>
        )}
      </div>

      <div className="ticket-summary-actions">
        <Button
          variant="primary"
          onClick={onProcessSale}
          disabled={!isValid || isProcessing}
          loading={isProcessing}
          style={{ width: '100%' }}
        >
          {isProcessing ? 'Procesando...' : 'Procesar Venta'}
        </Button>
      </div>
    </div>
  );
}

export const TicketSummary = memo(TicketSummaryComponent);
