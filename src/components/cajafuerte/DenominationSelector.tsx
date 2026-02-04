import { useMemo } from 'react';
import { STANDARD_DENOMINATIONS, getDenominationLabel, calculateTotal } from '@/utils/denominations';
import { NumberInput } from '@/components/forms/NumberInput';
import type { DenominationsMap } from '@/types/models';
import './DenominationSelector.css';

interface DenominationSelectorProps {
  denominations: DenominationsMap;
  onChange: (denominations: DenominationsMap) => void;
  availableDenominations?: DenominationsMap; // Para validar disponibilidad (en retirar)
  disabled?: boolean;
  showTotal?: boolean;
}

export function DenominationSelector({
  denominations,
  onChange,
  availableDenominations,
  disabled = false,
  showTotal = true,
}: DenominationSelectorProps) {
  const total = useMemo(() => calculateTotal(denominations), [denominations]);

  const handleChange = (value: number, denomination: number) => {
    const newDenominations = { ...denominations };
    const key = denomination.toString();
    
    if (value <= 0 || isNaN(value)) {
      delete newDenominations[key];
    } else {
      newDenominations[key] = Math.floor(value);
    }
    
    onChange(newDenominations);
  };

  const getError = (denomination: number): string | undefined => {
    if (!availableDenominations) return undefined;
    
    const key = denomination.toString();
    const requested = denominations[key] || 0;
    const available = availableDenominations[key] || 0;
    
    if (requested > available) {
      return `Disponibles: ${available}`;
    }
    
    return undefined;
  };

  return (
    <div className="denomination-selector">
      <div className="denomination-selector-grid">
        {STANDARD_DENOMINATIONS.map((denomination) => {
          const key = denomination.toString();
          const value = denominations[key] || 0;
          const error = getError(denomination);
          
          return (
            <div key={denomination} className="denomination-selector-item">
              <label className="denomination-selector-label">
                {getDenominationLabel(denomination)}
              </label>
              <NumberInput
                value={value}
                onChange={(newValue) => handleChange(newValue, denomination)}
                disabled={disabled}
                min={0}
                step={1}
                error={error}
                placeholder="0"
                className="denomination-selector-input"
              />
            </div>
          );
        })}
      </div>
      {showTotal && (
        <div className="denomination-selector-total">
          <strong>Total: €{total.toFixed(2)}</strong>
        </div>
      )}
    </div>
  );
}
