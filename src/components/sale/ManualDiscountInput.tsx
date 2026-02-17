import { useState, useEffect } from 'react';
import { HiOutlineTag, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import './ManualDiscountInput.css';

interface ManualDiscountInputProps {
  discountPercent: number | null;
  onApplyDiscount: (percent: number | null) => void;
}

export function ManualDiscountInput({ discountPercent, onApplyDiscount }: ManualDiscountInputProps) {
  const [percent, setPercent] = useState<string>(discountPercent?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);

  // Sincronizar con prop externa
  useEffect(() => {
    if (!isEditing) {
      setPercent(discountPercent?.toString() || '');
    }
  }, [discountPercent, isEditing]);

  const handleApply = () => {
    const value = parseFloat(percent);
    if (isNaN(value) || value < 0 || value > 100) {
      return;
    }
    onApplyDiscount(value > 0 ? value : null);
    setIsEditing(false);
  };

  const handleRemove = () => {
    onApplyDiscount(null);
    setPercent('');
    setIsEditing(false);
  };

  if (discountPercent !== null && !isEditing) {
    return (
      <div className="discount-applied">
        <div className="discount-info">
          <HiOutlineTag className="discount-icon" />
          <span className="discount-value">{discountPercent}% de descuento</span>
        </div>
        <div className="discount-actions">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={handleRemove}
            icon={<HiOutlineX />}
          >
            Quitar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="discount-input-container">
      <div className="discount-input-row">
        <div className="discount-input-wrapper">
          <Input
            type="number"
            placeholder="0"
            min="0"
            max="100"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApply();
              }
            }}
            className="discount-input"
          />
          <span className="discount-suffix">%</span>
        </div>
        <Button
          variant="secondary"
          onClick={handleApply}
          disabled={!percent || parseFloat(percent) < 0 || parseFloat(percent) > 100}
          icon={<HiOutlineCheck />}
        >
          Aplicar
        </Button>
        {isEditing && (
          <Button
            variant="secondary"
            onClick={() => {
              setIsEditing(false);
              setPercent(discountPercent?.toString() || '');
            }}
          >
            Cancelar
          </Button>
        )}
      </div>
      <span className="discount-hint">Descuento sobre el total de la venta</span>
    </div>
  );
}
