import { formatMoney } from '@/utils/money';
import { getMeasurementLongLabel, getMeasurementShortLabel } from '@/utils/measurement';
import type { ProductMeasurementType } from '@/types/models';
import './DispenseInfoCompact.css';

interface DispenseInfoCompactProps {
  pricePerGram: number;
  availableStock: number;
  measurementType: ProductMeasurementType;
}

export function DispenseInfoCompact({ pricePerGram, availableStock, measurementType }: DispenseInfoCompactProps) {
  const measurementSuffix = getMeasurementShortLabel(measurementType);
  const measurementLabel = getMeasurementLongLabel(measurementType);

  return (
    <div className="dispense-info-compact">
      <div className="dispense-info-compact-item">
        <span className="dispense-info-compact-label">Precio por {measurementLabel}:</span>
        <span className="dispense-info-compact-value">{formatMoney(pricePerGram)}/{measurementSuffix}</span>
      </div>
      <div className="dispense-info-compact-item">
        <span className="dispense-info-compact-label">Stock disponible:</span>
        <span className="dispense-info-compact-value">{availableStock.toFixed(2)}{measurementSuffix}</span>
      </div>
    </div>
  );
}
