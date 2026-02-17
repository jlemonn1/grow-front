import { formatMoney } from '@/utils/money';
import type { CajaFuerte } from '@/types/models';
import './CajaFuerteSummary.css';

interface CajaFuerteSummaryProps {
  cajaFuerte: CajaFuerte;
}

export function CajaFuerteSummary({ cajaFuerte }: CajaFuerteSummaryProps) {
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
    </div>
  );
}
