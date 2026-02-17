import './BatchStockInput.css';

interface BatchStockInputProps {
  productName: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function BatchStockInput({
  productName,
  value = '',
  onChange,
  disabled = false,
  placeholder,
  className = '',
}: BatchStockInputProps) {
  return (
    <div className={`batch-stock-input ${className}`}>
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? '0.00'}
        disabled={disabled}
        aria-label={`Agregar cantidad a ${productName}`}
      />
      <span className="batch-stock-input-unit">g</span>
    </div>
  );
}
