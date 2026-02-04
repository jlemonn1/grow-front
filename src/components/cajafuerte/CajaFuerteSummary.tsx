import { useMemo } from 'react';
import { formatMoney } from '@/utils/money';
import { STANDARD_DENOMINATIONS, getDenominationLabel, calculateTotal } from '@/utils/denominations';
import type { CajaFuerte } from '@/types/models';
import './CajaFuerteSummary.css';

interface CajaFuerteSummaryProps {
  cajaFuerte: CajaFuerte;
}

export function CajaFuerteSummary({ cajaFuerte }: CajaFuerteSummaryProps) {
  const denominationsList = useMemo(() => {
    return STANDARD_DENOMINATIONS
      .map((denomination) => {
        const key = denomination.toString();
        const quantity = cajaFuerte.denominations[key] || 0;
        const subtotal = denomination * quantity;
        return {
          denomination,
          quantity,
          subtotal,
        };
      })
      .filter((item) => item.quantity > 0)
      .sort((a, b) => b.denomination - a.denomination);
  }, [cajaFuerte.denominations]);

  return (
    <div className="cajafuerte-summary">
      <div className="cajafuerte-summary-header">
        <h3 className="cajafuerte-summary-title">Resumen de CajaFuerte</h3>
        <div className="cajafuerte-summary-total">
          <span className="cajafuerte-summary-total-label">Saldo Total:</span>
          <span className="cajafuerte-summary-total-amount">
            {formatMoney(cajaFuerte.totalAmount)}
          </span>
        </div>
      </div>

      {denominationsList.length > 0 ? (
        <div className="cajafuerte-summary-denominations">
          <h4 className="cajafuerte-summary-subtitle">Desglose por denominaciones:</h4>
          <div className="cajafuerte-summary-grid">
            {denominationsList.map((item) => (
              <div key={item.denomination} className="cajafuerte-summary-item">
                <div className="cajafuerte-summary-item-label">
                  {getDenominationLabel(item.denomination)}
                </div>
                <div className="cajafuerte-summary-item-quantity">
                  {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                </div>
                <div className="cajafuerte-summary-item-subtotal">
                  {formatMoney(item.subtotal)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cajafuerte-summary-empty">
          <p>No hay dinero en la CajaFuerte</p>
        </div>
      )}
    </div>
  );
}
