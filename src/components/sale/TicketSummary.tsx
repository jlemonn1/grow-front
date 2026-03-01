import { memo, useMemo } from 'react';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { formatMoney } from '@/utils/money';
import { useConfig } from '@/context/config.context';
import { CouponInput } from './CouponInput';
import { ManualDiscountInput } from './ManualDiscountInput';
import type { TicketItem } from '@/types/models';
import type { AppliedCoupon, ManualDiscountType } from '@/context/ticket.context';
import './TicketSummary.css';

interface TicketSummaryProps {
  customerName: string | null;
  customerBalance?: number;
  items: TicketItem[];
  total: number;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  cashGiven: number;
  change: number;
  isValid: boolean;
  isProcessing: boolean;
  useBalance: boolean;
  balanceToUse: number;
  saveChangeToBalance: boolean;
  balanceUsed: number;
  balanceRemaining: number;
  appliedCoupon: AppliedCoupon | null;
  manualDiscountPercent: number | null;
  manualDiscountType: ManualDiscountType;
  onCashGivenChange: (amount: number) => void;
  onUseBalanceChange: (use: boolean) => void;
  onBalanceToUseChange: (amount: number) => void;
  onSaveChangeToBalanceChange: (save: boolean) => void;
  onApplyCoupon: (coupon: AppliedCoupon) => void;
  onRemoveCoupon: () => void;
  onSetManualDiscount: (value: number | null, type: ManualDiscountType) => void;
  onProcessSale: () => void;
  cashGivenError?: string;
}

function TicketSummaryComponent({
  customerName,
  customerBalance = 0,
  items,
  total,
  subtotalBeforeDiscount,
  discountAmount,
  cashGiven,
  change,
  isValid,
  isProcessing,
  useBalance,
  balanceToUse,
  saveChangeToBalance,
  balanceUsed,
  balanceRemaining,
  appliedCoupon,
  manualDiscountPercent,
  manualDiscountType,
  onCashGivenChange: _onCashGivenChange,
  onUseBalanceChange,
  onBalanceToUseChange,
  onSaveChangeToBalanceChange,
  onApplyCoupon,
  onRemoveCoupon,
  onSetManualDiscount,
  onProcessSale,
  cashGivenError,
}: TicketSummaryProps) {
  const { config } = useConfig();
  const showCashDetails = config?.showCashDetails ?? true;
  const enableCustomerBalance = config?.enableCustomerBalance ?? true;
  // cashGiven se controla desde la página (teclado numérico), no mantenemos estado local aquí

  const hasItems = useMemo(() => items.length > 0, [items.length]);
  const hasInvalidItems = useMemo(
    () => items.some(item => item.validationState === 'invalid'),
    [items]
  );
  const cashInsufficient = useMemo(
    () => {
      if (useBalance) {
        // Cuando se usa saldo: verificar que efectivo + saldo cubra el total
        return cashGiven > 0 && (cashGiven + balanceUsed) < total;
      }
      // Sin saldo: validación normal
      return cashGiven > 0 && cashGiven < total;
    },
    [cashGiven, total, useBalance, balanceUsed]
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

            {/* Sección de cupones y descuentos */}
            <div className="ticket-summary-discount-section">
              <CouponInput
                appliedCoupon={appliedCoupon}
                onApplyCoupon={onApplyCoupon}
                onRemoveCoupon={onRemoveCoupon}
              />
              
              {!appliedCoupon && (
                <ManualDiscountInput
                  discountPercent={manualDiscountPercent}
                  discountType={manualDiscountType}
                  onApplyDiscount={onSetManualDiscount}
                  maxDiscountValue={subtotalBeforeDiscount}
                />
              )}
            </div>

            {/* Desglose de totales */}
            <div className="ticket-summary-breakdown">
              <div className="ticket-summary-row">
                <span>Subtotal:</span>
                <span>{formatMoney(subtotalBeforeDiscount)}</span>
              </div>
              
              {discountAmount > 0 && (
                <>
                  {appliedCoupon && (
                    <div className="ticket-summary-row ticket-summary-coupon-info">
                      <span>Cupón ({appliedCoupon.code}):</span>
                      <span>
                        {appliedCoupon.discountType === 'PERCENTAGE' 
                          ? `-${appliedCoupon.discountValue}%` 
                          : `-${formatMoney(appliedCoupon.discountValue)}`
                        }
                      </span>
                    </div>
                  )}
                  
                  {manualDiscountPercent && manualDiscountPercent > 0 && (
                    <div className="ticket-summary-row ticket-summary-manual-discount">
                      <span>Descuento manual:</span>
                      <span>-{manualDiscountPercent}%</span>
                    </div>
                  )}
                  
                  <div className="ticket-summary-row ticket-summary-discount-amount">
                    <span>Descuento total:</span>
                    <span className="discount-value">-{formatMoney(discountAmount)}</span>
                  </div>
                  
                  <div className="ticket-summary-divider" />
                </>
              )}
              
              <div className="ticket-summary-row ticket-summary-total">
                <span>Total:</span>
                <span className="total-value">{formatMoney(total)}</span>
              </div>
            </div>

{/* Toggle para usar saldo */}
            {enableCustomerBalance && customerBalance > 0 && (
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
                {cashGivenError && (
                  <div className="ticket-summary-cash-error">
                    {cashGivenError}
                  </div>
                )}
                
                {cashGiven > 0 && (
                  <div className="ticket-summary-cash-total">
                    <span className="ticket-summary-cash-total-label">
                      {useBalance ? "Efectivo total" : "Efectivo recibido"}:
                    </span>
                     <span className="ticket-summary-cash-total-value">
                       {formatMoney(cashGiven)}
                     </span>
                  </div>
                )}
              </div>
            )}

{/* Checkbox para guardar cambio en saldo */}
            {enableCustomerBalance && change > 0 && (
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

            {cashInsufficient && (
              <div className="ticket-summary-error">
                <HiExclamationTriangle className="ticket-summary-error-icon" />
                {useBalance 
                  ? `El efectivo más el saldo no cubren el total. Faltan: ${formatMoney(Math.max(0, total - balanceUsed - cashGiven))}`
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
          {isProcessing ? 'Procesando...' : 'Dispensar'}
        </Button>
      </div>
    </div>
  );
}

export const TicketSummary = memo(TicketSummaryComponent);
