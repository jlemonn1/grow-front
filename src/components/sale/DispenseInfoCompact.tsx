import { formatMoney } from '@/utils/money';
import './DispenseInfoCompact.css';

interface DispenseInfoCompactProps {
  pricePerGram: number;
  availableStock: number;
}

export function DispenseInfoCompact({ pricePerGram, availableStock }: DispenseInfoCompactProps) {
  return (
    <div className="dispense-info-compact">
      <div className="dispense-info-compact-item">
        <span className="dispense-info-compact-label">Precio por gramo:</span>
        <span className="dispense-info-compact-value">{formatMoney(pricePerGram)}</span>
      </div>
      <div className="dispense-info-compact-item">
        <span className="dispense-info-compact-label">Stock disponible:</span>
        <span className="dispense-info-compact-value">{availableStock.toFixed(2)}g</span>
      </div>
    </div>
  );
}
