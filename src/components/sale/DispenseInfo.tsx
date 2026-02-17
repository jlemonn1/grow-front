import { formatMoney } from '@/utils/money';
import { getMeasurementLongLabel, getMeasurementShortLabel } from '@/utils/measurement';
import type { ProductMeasurementType } from '@/types/models';
import './DispenseInfo.css';

interface DispenseInfoProps {
  pricePerGram: number;
  availableStock: number;
  measurementType: ProductMeasurementType;
}

export function DispenseInfo({ pricePerGram, availableStock, measurementType }: DispenseInfoProps) {
  const measurementSuffix = getMeasurementShortLabel(measurementType);
  const measurementLabel = getMeasurementLongLabel(measurementType);

  return (
    <div className="dispense-info">
      <div className="dispense-info-item">
        <span className="dispense-info-label">Precio por {measurementLabel}:</span>
        <span className="dispense-info-value">{formatMoney(pricePerGram)}/{measurementSuffix}</span>
      </div>
      <div className="dispense-info-item">
        <span className="dispense-info-label">Stock disponible:</span>
        <span className="dispense-info-value">{availableStock.toFixed(2)}{measurementSuffix}</span>
      </div>
    </div>
  );
}
