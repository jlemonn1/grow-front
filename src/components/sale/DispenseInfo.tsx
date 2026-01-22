import { formatMoney } from '@/utils/money';
import './DispenseInfo.css';

interface DispenseInfoProps {
  pricePerGram: number;
  availableStock: number;
}

export function DispenseInfo({ pricePerGram, availableStock }: DispenseInfoProps) {
  return (
    <div className="dispense-info">
      <div className="dispense-info-item">
        <span className="dispense-info-label">Precio por gramo:</span>
        <span className="dispense-info-value">{formatMoney(pricePerGram)}</span>
      </div>
      <div className="dispense-info-item">
        <span className="dispense-info-label">Stock disponible:</span>
        <span className="dispense-info-value">{availableStock.toFixed(2)}g</span>
      </div>
    </div>
  );
}
