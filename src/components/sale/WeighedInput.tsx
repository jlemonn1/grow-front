import { useEffect, useState } from 'react';
import './WeighedInput.css';

interface WeighedInputProps {
  baseValue: number;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}

export function WeighedInput({
  baseValue,
  value,
  min: propMin,
  max: propMax,
  onChange,
  unit = 'g',
  disabled = false,
}: WeighedInputProps) {
  const [localValue, setLocalValue] = useState(value || baseValue);

  const min = propMin ?? baseValue;
  const max = propMax ?? Math.min(baseValue + 0.1, 999.99);

  useEffect(() => {
    if (!disabled && baseValue > 0) {
      const newValue = baseValue;
      setLocalValue(newValue);
      onChange(newValue);
    }
  }, [baseValue, disabled]);

  useEffect(() => {
    if (!disabled) {
      setLocalValue(value || baseValue);
    }
  }, [value, baseValue, disabled]);

  const handleDecrement = () => {
    const newValue = Math.max(min, localValue - 0.01);
    const rounded = Math.round(newValue * 100) / 100;
    setLocalValue(rounded);
    onChange(rounded);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, localValue + 0.01);
    const rounded = Math.round(newValue * 100) / 100;
    setLocalValue(rounded);
    onChange(rounded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value) || 0;
    const clamped = Math.max(min, Math.min(max, inputValue));
    const rounded = Math.round(clamped * 100) / 100;
    setLocalValue(rounded);
    onChange(rounded);
  };

  const handleInputBlur = () => {
    const clamped = Math.max(min, Math.min(max, localValue));
    const rounded = Math.round(clamped * 100) / 100;
    setLocalValue(rounded);
    onChange(rounded);
  };

  if (disabled || baseValue <= 0) {
    return null;
  }

  return (
    <div className="weighed-input-container">
      <label className="weighed-input-label">Real</label>
      <div className="weighed-input-wrapper">
        <button
          type="button"
          className="weighed-btn weighed-btn-decrement"
          onClick={handleDecrement}
          disabled={disabled || localValue <= min}
          aria-label="Decrecer"
        >
          −
        </button>
        <input
          type="number"
          className="weighed-input"
          value={localValue.toFixed(2)}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={0.01}
          disabled={disabled}
          aria-label="Gramaje real"
        />
        <span className="weighed-input-unit">{unit}</span>
        <button
          type="button"
          className="weighed-btn weighed-btn-increment"
          onClick={handleIncrement}
          disabled={disabled || localValue >= max}
          aria-label="Incrementar"
        >
          +
        </button>
      </div>
    </div>
  );
}
