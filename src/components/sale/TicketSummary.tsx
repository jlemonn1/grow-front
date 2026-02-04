import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { CashBillButtons } from './CashBillButtons';
import { formatMoney } from '@/utils/money';
import { getDenominationLabel } from '@/utils/denominations';
import { useConfig } from '@/context/config.context';
import type { TicketItem, DenominationsMap } from '@/types/models';
import './TicketSummary.css';

interface TicketSummaryProps {
  customerName: string | null;
  customerBalance?: number;
  items: TicketItem[];
  total: number;
  cashGiven: number;
  change: number;
  isValid: boolean;
  isProcessing: boolean;
  useBalance: boolean;
  balanceToUse: number;
  saveChangeToBalance: boolean;
  balanceUsed: number;
  balanceRemaining: number;
  onCashGivenChange: (amount: number) => void;
  onUseBalanceChange: (use: boolean) => void;
  onBalanceToUseChange: (amount: number) => void;
  onSaveChangeToBalanceChange: (save: boolean) => void;
  onProcessSale: () => void;
  cashGivenError?: string;
  cashGivenDenominations?: DenominationsMap;
  changeDenominations?: DenominationsMap | null;
  onCashGivenDenominationsChange?: (denominations: DenominationsMap) => void;
}

function TicketSummaryComponent({
  customerName,
  customerBalance = 0,
  items,
  total,
  cashGiven,
  change,
  isValid,
  isProcessing,
  useBalance,
  balanceToUse,
  saveChangeToBalance,
  balanceUsed,
  balanceRemaining,
  onCashGivenChange,
  onUseBalanceChange,
  onBalanceToUseChange,
  onSaveChangeToBalanceChange,
  onProcessSale,
  cashGivenError,
  cashGivenDenominations,
  changeDenominations,
  onCashGivenDenominationsChange,
}: TicketSummaryProps) {
  const { config } = useConfig();
  const showCashDetails = config?.showCashDetails ?? true;
  const [localCashGiven, setLocalCashGiven] = useState(cashGiven);

  // Sincronizar el estado local cuando cashGiven cambia externamente (por ejemplo, al resetear)
  useEffect(() => {
    setLocalCashGiven(cashGiven);
  }, [cashGiven]);


  const handleAddAmount = useCallback((amount: number) => {
    const newValue = (localCashGiven || 0) + amount;
    setLocalCashGiven(newValue);
    onCashGivenChange(newValue);
  }, [localCashGiven, onCashGivenChange]);

  const handleDenominationAdd = useCallback((denomination: number) => {
    if (onCashGivenDenominationsChange) {
      const current = cashGivenDenominations || {};
      const denominationKey = denomination.toString();
      const currentQty = current[denominationKey] || 0;
      onCashGivenDenominationsChange({
        ...current,
        [denominationKey]: currentQty + 1,
      });
    }
  }, [cashGivenDenominations, onCashGivenDenominationsChange]);

  const handleResetCash = useCallback(() => {
    setLocalCashGiven(0);
    onCashGivenChange(0);
    if (onCashGivenDenominationsChange) {
      onCashGivenDenominationsChange({});
    }
  }, [onCashGivenChange, onCashGivenDenominationsChange]);

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
          <span>Socio:</span>
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
                <HiExclamationTriangle className="ticket-summary-error-icon" />
                Hay productos con errores de validación. Revisa las líneas del ticket.
              </div>
            )}

            <div className="ticket-summary-divider" />

            <div className="ticket-summary-row ticket-summary-total">
              <span>Total:</span>
              <span>{formatMoney(total)}</span>
            </div>

            {/* Toggle para usar saldo */}
            {customerBalance > 0 && (
              <div className="ticket-summary-balance-section">
                <label className="ticket-summary-balance-toggle">
                  <input
                    type="checkbox"
                    checked={useBalance}
                    onChange={(e) => onUseBalanceChange(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <span>Usar saldo disponible ({formatMoney(customerBalance)})</span>
                </label>
                
                {useBalance && (
                  <div className="ticket-summary-balance-info">
                    <NumberInput
                      label="Cantidad de saldo a usar"
                      value={balanceToUse}
                      onChange={onBalanceToUseChange}
                      min={0}
                      max={Math.min(customerBalance, total)}
                      step={0.01}
                      placeholder="0.00"
                      disabled={isProcessing}
                      required
                    />
                    <div className="ticket-summary-row">
                      <span>Saldo usado:</span>
                      <span>{formatMoney(balanceUsed)}</span>
                    </div>
                    {balanceRemaining > 0 && (
                      <div className="ticket-summary-row">
                        <span>Saldo restante:</span>
                        <span>{formatMoney(balanceRemaining)}</span>
                      </div>
                    )}
                    {balanceUsed < total && (
                      <div className="ticket-summary-row ticket-summary-remaining-amount">
                        <span>Restante a pagar en efectivo:</span>
                        <span>{formatMoney(total - balanceUsed)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Campo de efectivo - solo mostrar si el saldo no cubre todo o no se usa saldo */}
            {(!useBalance || balanceUsed < total) && (
              <div className="ticket-summary-cash-input">
                <CashBillButtons 
                  onAddAmount={handleAddAmount} 
                  onDenominationAdd={handleDenominationAdd}
                  denominations={cashGivenDenominations}
                  onReset={handleResetCash}
                />
                {cashGivenError && (
                  <div className="ticket-summary-cash-error">
                    {cashGivenError}
                  </div>
                )}
                {localCashGiven > 0 && (
                  <div className="ticket-summary-cash-total">
                    <span className="ticket-summary-cash-total-label">
                      {useBalance ? "Efectivo necesario" : "Efectivo recibido"}:
                    </span>
                    <span className="ticket-summary-cash-total-value">
                      {formatMoney(localCashGiven)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Checkbox para guardar cambio en saldo */}
            {change > 0 && (
              <div className="ticket-summary-save-change">
                <label className="ticket-summary-save-change-toggle">
                  <input
                    type="checkbox"
                    checked={saveChangeToBalance}
                    onChange={(e) => onSaveChangeToBalanceChange(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <span>Guardar cambio en saldo ({formatMoney(change)})</span>
                </label>
              </div>
            )}

            {showCashDetails && change > 0 && !saveChangeToBalance && (
              <div className="ticket-summary-row ticket-summary-change" data-tour="change">
                <span>Cambio:</span>
                <span>{formatMoney(change)}</span>
              </div>
            )}

            {/* Resumen de denominaciones recibidas */}
            {cashGivenDenominations && Object.keys(cashGivenDenominations).length > 0 && (
              <div className="ticket-summary-denominations">
                <div className="ticket-summary-denominations-title">Denominaciones recibidas:</div>
                <div className="ticket-summary-denominations-list">
                  {Object.entries(cashGivenDenominations)
                    .filter(([_, qty]) => qty > 0)
                    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                    .map(([denomination, qty]) => (
                      <span key={denomination} className="ticket-summary-denomination-item">
                        {qty}x {getDenominationLabel(parseFloat(denomination))}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Resumen de denominaciones de cambio - Mostrar de forma prominente */}
            {changeDenominations && Object.keys(changeDenominations).length > 0 && change > 0 && !saveChangeToBalance && (
              <div className="ticket-summary-change-display">
                <div className="ticket-summary-change-header">
                  <strong>Cambio a dar: {formatMoney(change)}</strong>
                </div>
                <div className="ticket-summary-change-denominations">
                  {Object.entries(changeDenominations)
                    .filter(([_, qty]) => qty > 0)
                    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                    .map(([denomination, qty]) => (
                      <div key={denomination} className="ticket-summary-change-item">
                        <span className="ticket-summary-change-quantity">{qty}x</span>
                        <span className="ticket-summary-change-label">{getDenominationLabel(parseFloat(denomination))}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {cashInsufficient && (
              <div className="ticket-summary-error">
                <HiExclamationTriangle className="ticket-summary-error-icon" />
                {useBalance 
                  ? `El efectivo más el saldo no cubren el total. Faltan: ${formatMoney(total - balanceUsed - cashGiven)}`
                  : 'El efectivo debe ser mayor o igual al total'}
              </div>
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
          data-tour="confirm-sale"
        >
          {isProcessing ? 'Procesando...' : 'Procesar Venta'}
        </Button>
      </div>
    </div>
  );
}

export const TicketSummary = memo(TicketSummaryComponent);
