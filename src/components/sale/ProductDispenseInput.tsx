import { useEffect } from 'react';
import { useProductDispense } from '@/hooks/useProductDispense';
import { getMeasurementLongLabel, getMeasurementShortLabel } from '@/utils/measurement';
import { DispenseInputField } from './DispenseInputField';
import { DispenseInfoCompact } from './DispenseInfoCompact';
import { WeighedInput } from './WeighedInput';
import type { Product } from '@/types/models';
import './ProductDispenseInput.css';

interface ProductDispenseInputProps {
  product: Product | null;
  availableStock: number;
  initialGrams?: number;
  onGramsChange?: (grams: number) => void;
  onEurosChange?: (euros: number) => void;
  onActualWeighedGramsChange?: (grams: number) => void;
  gramsInputRef?: React.RefObject<HTMLInputElement>;
  eurosInputRef?: React.RefObject<HTMLInputElement>;
}

export function ProductDispenseInput({
  product,
  availableStock,
  initialGrams,
  onGramsChange,
  onEurosChange,
  onActualWeighedGramsChange,
  gramsInputRef,
  eurosInputRef,
}: ProductDispenseInputProps) {
  const {
    grams,
    euros,
    actualWeighedGrams,
    error,
    setGrams,
    setEuros,
    setActualWeighedGrams,
    effectivePricePerGram,
  } = useProductDispense({
    product,
    availableStock,
    initialGrams,
  });

  // Notificar cambios de gramos al componente padre
  useEffect(() => {
    if (onGramsChange) {
      onGramsChange(grams);
    }
  }, [grams, onGramsChange]);

  // Notificar cambios de euros al componente padre
  useEffect(() => {
    if (onEurosChange) {
      onEurosChange(euros);
    }
  }, [euros, onEurosChange]);

  // Notificar cambios de cantidad pesada al componente padre
  useEffect(() => {
    if (onActualWeighedGramsChange) {
      onActualWeighedGramsChange(actualWeighedGrams);
    }
  }, [actualWeighedGrams, onActualWeighedGramsChange]);

  if (!product) {
    return null;
  }

  const measurementLongLabel = getMeasurementLongLabel(product.measurementType);
  const measurementSuffix = getMeasurementShortLabel(product.measurementType);

  return (
    <div className="product-dispense-input">
      <div className="product-dispense-input-row">
        <DispenseInputField
          id="dispense-grams"
          label={measurementLongLabel}
          value={grams}
          onChange={setGrams}
          error={error && grams > availableStock ? error : undefined}
          inputRef={gramsInputRef}
          dataTour="grams-input"
        />
        <DispenseInputField
          id="dispense-euros"
          label="Euros (€)"
          value={euros}
          onChange={setEuros}
          error={error && euros > 0 && grams <= availableStock ? error : undefined}
          inputRef={eurosInputRef}
        />
        <WeighedInput
          baseValue={grams}
          value={actualWeighedGrams}
          min={grams}
          max={Math.min(grams + 0.1, availableStock)}
          onChange={setActualWeighedGrams}
          unit={measurementSuffix}
        />
      </div>
      
      <DispenseInfoCompact 
        pricePerGram={effectivePricePerGram}
        availableStock={availableStock}
        measurementType={product.measurementType}
      />
      
      {error && (
        <div className="product-dispense-error">
          {error}
        </div>
      )}
    </div>
  );
}
