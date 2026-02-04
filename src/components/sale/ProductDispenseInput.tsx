import { useEffect } from 'react';
import { useProductDispense } from '@/hooks/useProductDispense';
import { formatMoney } from '@/utils/money';
import { DispenseInputField } from './DispenseInputField';
import { ShortcutButtons } from './ShortcutButtons';
import { DispenseInfoCompact } from './DispenseInfoCompact';
import type { Product } from '@/types/models';
import './ProductDispenseInput.css';

interface ProductDispenseInputProps {
  product: Product | null;
  availableStock: number;
  initialGrams?: number;
  onGramsChange?: (grams: number) => void;
  gramsInputRef?: React.RefObject<HTMLInputElement>;
  eurosInputRef?: React.RefObject<HTMLInputElement>;
}

export function ProductDispenseInput({
  product,
  availableStock,
  initialGrams,
  onGramsChange,
  gramsInputRef,
  eurosInputRef,
}: ProductDispenseInputProps) {
  const {
    grams,
    euros,
    error,
    setGrams,
    setEuros,
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

  if (!product) {
    return null;
  }

  const gramsShortcuts = [1, 2, 3, 4, 5, 10];
  const eurosShortcuts = [5, 10, 15, 20, 50];

  const handleGramsShortcut = (value: number) => {
    const maxGrams = Math.min(value, availableStock);
    setGrams(maxGrams);
  };

  const handleEurosShortcut = (value: number) => {
    setEuros(value);
  };

  return (
    <div className="product-dispense-input">
      <div className="product-dispense-input-row">
        <DispenseInputField
          id="dispense-grams"
          label="Gramos"
          value={grams}
          onChange={setGrams}
          error={error && grams > availableStock ? error : undefined}
          inputRef={gramsInputRef}
          dataTour="grams-input"
          shortcuts={
            <ShortcutButtons
              shortcuts={gramsShortcuts}
              onShortcutClick={handleGramsShortcut}
              isDisabled={(value) => value > availableStock}
              getTitle={(value) => `${value}g`}
              activeValue={grams}
            />
          }
        />
        <DispenseInputField
          id="dispense-euros"
          label="Euros (€)"
          value={euros}
          onChange={setEuros}
          error={error && euros > 0 && grams <= availableStock ? error : undefined}
          inputRef={eurosInputRef}
          shortcuts={
            <ShortcutButtons
              shortcuts={eurosShortcuts}
              onShortcutClick={handleEurosShortcut}
              formatValue={(value) => `${value}€`}
              getTitle={(value) => formatMoney(value)}
              activeValue={euros}
            />
          }
        />
      </div>
      
      <DispenseInfoCompact 
        pricePerGram={effectivePricePerGram}
        availableStock={availableStock}
      />
      
      {error && (
        <div className="product-dispense-error">
          {error}
        </div>
      )}
    </div>
  );
}
