import { useState, useCallback } from 'react';
import { formatMoney } from '@/utils/money';
import './NumericKeypad.css';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxValue?: number;
  disabled?: boolean;
  showSubmit?: boolean;
}

export function NumericKeypad({
  value,
  onChange,
  onSubmit,
  maxValue,
  disabled = false,
  showSubmit = true,
}: NumericKeypadProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handleKeyPress = useCallback((key: string) => {
    if (disabled) return;

    // Visual feedback
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 100);

    // Play sound effect (optional)
    try {
      const audio = new Audio('/sounds/keypad-click.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if audio fails
    } catch {
      // Ignore audio errors
    }

    switch (key) {
      case 'C':
        onChange('');
        break;
      case '←':
        onChange(value.slice(0, -1));
        break;
      case '.':
        if (!value.includes('.')) {
          onChange(value + '.');
        }
        break;
      case '0':
        if (value !== '0') {
          const newValue = value + '0';
          if (maxValue === undefined || parseFloat(newValue) <= maxValue) {
            onChange(newValue);
          }
        }
        break;
      default:
        // Numbers 1-9
        const newValue = value + key;
        // Validate decimals (max 2 decimal places)
        if (value.includes('.')) {
          const [, decimals] = value.split('.');
          if (decimals && decimals.length >= 2) {
            return; // Don't allow more than 2 decimal places
          }
        }
        if (maxValue === undefined || parseFloat(newValue) <= maxValue) {
          onChange(newValue);
        }
    }
  }, [value, onChange, maxValue, disabled]);

  const renderKey = (key: string, className: string = '') => (
    <button
      key={key}
      type="button"
      className={`keypad-button ${className} ${pressedKey === key ? 'pressed' : ''}`}
      onClick={() => handleKeyPress(key)}
      disabled={disabled}
    >
      {key}
    </button>
  );

  const numericValue = parseFloat(value) || 0;

  return (
    <div className="numeric-keypad">
      <div className="keypad-display">
        <div className="keypad-display-content">
          <span className="keypad-display-currency">€</span>
          <span className="keypad-display-value">
            {value ? formatMoney(numericValue).replace('€', '').trim() : '0.00'}
          </span>
        </div>
      </div>

      <div className="keypad-grid">
        <div className="keypad-row">
          {renderKey('7')}
          {renderKey('8')}
          {renderKey('9')}
        </div>
        <div className="keypad-row">
          {renderKey('4')}
          {renderKey('5')}
          {renderKey('6')}
        </div>
        <div className="keypad-row">
          {renderKey('1')}
          {renderKey('2')}
          {renderKey('3')}
        </div>
        <div className="keypad-row">
          {renderKey('C', 'keypad-clear')}
          {renderKey('0')}
          {renderKey('.', 'keypad-dot')}
        </div>
      </div>

      {showSubmit && (
        <button
          type="button"
          className="keypad-submit"
          onClick={onSubmit}
          disabled={disabled || numericValue <= 0}
        >
          ✓ Confirmar
        </button>
      )}
    </div>
  );
}
