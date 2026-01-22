import { ReactNode } from 'react';
import { DispenseNumberInput } from './DispenseNumberInput';
import { DispenseFieldLayout } from './DispenseFieldLayout';
import './DispenseInputField.css';

interface DispenseInputFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  shortcuts: ReactNode;
  min?: number;
  step?: number;
  placeholder?: string;
}

export function DispenseInputField({
  id,
  label,
  value,
  onChange,
  error,
  inputRef,
  shortcuts,
  min = 0.01,
  step = 0.01,
  placeholder = '0.00',
}: DispenseInputFieldProps) {
  return (
    <div className="dispense-input-field">
      <label htmlFor={id} className="dispense-input-field-label">
        {label}
      </label>
      <DispenseFieldLayout
        shortcuts={shortcuts}
      >
        <DispenseNumberInput
          ref={inputRef}
          id={id}
          value={value}
          onChange={onChange}
          min={min}
          step={step}
          placeholder={placeholder}
          error={error}
        />
      </DispenseFieldLayout>
    </div>
  );
}
