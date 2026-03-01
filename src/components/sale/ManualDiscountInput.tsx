import { useState, useEffect } from 'react';
import { HiOutlineTag, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import './ManualDiscountInput.css';

type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

interface ManualDiscountInputProps {
  discountPercent: number | null;
  discountType: DiscountType;
  onApplyDiscount: (value: number | null, type: DiscountType) => void;
  maxDiscountValue?: number;
}

export function ManualDiscountInput({ 
  discountPercent, 
  discountType, 
  onApplyDiscount, 
  maxDiscountValue = 100 
}: ManualDiscountInputProps) {
  const [value, setValue] = useState<string>(discountPercent?.toString() || '');
  const [type, setType] = useState<DiscountType>(discountType);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setValue(discountPercent?.toString() || '');
      setType(discountType);
    }
  }, [discountPercent, discountType, isEditing]);

  const handleApply = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }
    
    if (type === 'PERCENTAGE' && numValue > 100) {
      return;
    }
    
    if (type === 'FIXED_AMOUNT' && maxDiscountValue > 0 && numValue > maxDiscountValue) {
      return;
    }
    
    onApplyDiscount(numValue > 0 ? numValue : null, type);
    setIsEditing(false);
  };

  const handleRemove = () => {
    onApplyDiscount(null, 'PERCENTAGE');
    setValue('');
    setIsEditing(false);
  };

  const handleTypeChange = (newType: DiscountType) => {
    setType(newType);
    setValue('');
  };

  if (discountPercent !== null && !isEditing) {
    return (
      <div className="discount-applied">
        <div className="discount-info">
          <HiOutlineTag className="discount-icon" />
          <span className="discount-value">
            {discountType === 'PERCENTAGE' 
              ? `${discountPercent}% de descuento` 
              : `${discountPercent.toFixed(2)}€ de descuento`
            }
          </span>
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
      <div className="discount-toggle">
        <button
          type="button"
          className={`toggle-btn ${type === 'PERCENTAGE' ? 'active' : ''}`}
          onClick={() => handleTypeChange('PERCENTAGE')}
        >
          %
        </button>
        <button
          type="button"
          className={`toggle-btn ${type === 'FIXED_AMOUNT' ? 'active' : ''}`}
          onClick={() => handleTypeChange('FIXED_AMOUNT')}
        >
          €
        </button>
      </div>
      <div className="discount-input-row">
        <div className="discount-input-wrapper">
          <Input
            type="number"
            placeholder="0"
            min="0"
            max={type === 'PERCENTAGE' ? '100' : maxDiscountValue.toString()}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApply();
              }
            }}
            className="discount-input"
          />
          <span className="discount-suffix">{type === 'PERCENTAGE' ? '%' : '€'}</span>
        </div>
        <Button
          variant="secondary"
          onClick={handleApply}
          disabled={!value || parseFloat(value) < 0 || (type === 'PERCENTAGE' && parseFloat(value) > 100) || (type === 'FIXED_AMOUNT' && maxDiscountValue > 0 && parseFloat(value) > maxDiscountValue)}
          icon={<HiOutlineCheck />}
        >
          Aplicar
        </Button>
        {isEditing && (
          <Button
            variant="secondary"
            onClick={() => {
              setIsEditing(false);
              setValue(discountPercent?.toString() || '');
              setType(discountType);
            }}
          >
            Cancelar
          </Button>
        )}
      </div>
      <span className="discount-hint">
        {type === 'PERCENTAGE' 
          ? 'Descuento sobre el total de la dispensación' 
          : `Cantidad fija de descuento (max ${maxDiscountValue.toFixed(2)}€)`
        }
      </span>
    </div>
  );
}
