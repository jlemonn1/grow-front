import { forwardRef } from 'react';
import { NumberInput } from '@/components/forms/NumberInput';
import './DispenseNumberInput.css';

interface DispenseNumberInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  step?: number;
  placeholder?: string;
  dataTour?: string;
}

export const DispenseNumberInput = forwardRef<HTMLInputElement, DispenseNumberInputProps>(
  ({ id, value, onChange, error, min = 0.01, step = 0.01, placeholder = '0.00', dataTour }, ref) => {
    return (
      <div className="dispense-number-input">
        <NumberInput
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          min={min}
          step={step}
          placeholder={placeholder}
          error={error}
          data-tour={dataTour}
        />
      </div>
    );
  }
);

DispenseNumberInput.displayName = 'DispenseNumberInput';
