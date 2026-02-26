import { HiOutlineUser, HiOutlineCurrencyEuro } from 'react-icons/hi';
import type { TicketItem, Customer } from '@/types/models';
import './WizardSummary.css';

interface WizardSummaryProps {
  customer: Customer | null;
  items: TicketItem[];
  total: number;
  discountAmount: number;
  cashGiven: number;
  change: number;
  useBalance: boolean;
  balanceToUse: number;
}

export function WizardSummary({
  customer,
  items,
  total,
  discountAmount,
  cashGiven,
  change,
  useBalance,
  balanceToUse,
}: WizardSummaryProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const effectiveTotal = useBalance ? total - balanceToUse : total;

  return (
    <div className="wizard-summary-card">
      <div className="wizard-summary-header">
        <h3>Resumen de Venta</h3>
      </div>
      
      <div className="wizard-summary-content">
        <div className="wizard-summary-row">
          <HiOutlineUser className="wizard-summary-icon" />
          <span className="wizard-summary-label">Socio:</span>
          <span className="wizard-summary-value">{customer?.displayName || 'Sin socio'}</span>
        </div>

        <div className="wizard-summary-items">
          {items.map((item, index) => (
            <div key={index} className="wizard-summary-item-row">
              <span className="wizard-summary-item-name">{item.product?.name || 'Producto'}</span>
              <span className="wizard-summary-item-qty">{item.grams.toFixed(1)}g</span>
              <span className="wizard-summary-item-price">{formatMoney(item.grams * item.pricePerGram)}</span>
            </div>
          ))}
        </div>

        {discountAmount > 0 && (
          <div className="wizard-summary-row wizard-summary-discount">
            <span className="wizard-summary-label">Descuento:</span>
            <span className="wizard-summary-value">-{formatMoney(discountAmount)}</span>
          </div>
        )}

        {useBalance && balanceToUse > 0 && (
          <div className="wizard-summary-row wizard-summary-balance">
            <span className="wizard-summary-label">Saldo usado:</span>
            <span className="wizard-summary-value">-{formatMoney(balanceToUse)}</span>
          </div>
        )}

        <div className="wizard-summary-total">
          <span>Total:</span>
          <span className="wizard-summary-total-value">{formatMoney(effectiveTotal)}</span>
        </div>

        {cashGiven > 0 && (
          <div className="wizard-summary-row">
            <HiOutlineCurrencyEuro className="wizard-summary-icon" />
            <span className="wizard-summary-label">Efectivo:</span>
            <span className="wizard-summary-value">{formatMoney(cashGiven)}</span>
          </div>
        )}

        {change > 0 && cashGiven > 0 && (
          <div className="wizard-summary-row wizard-summary-change">
            <span className="wizard-summary-label">Cambio:</span>
            <span className="wizard-summary-value">{formatMoney(change)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
