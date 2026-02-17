import { useState } from 'react';
import { HiOutlineTicket, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { couponsService } from '@/services/coupons.service';
import { useUI } from '@/context/ui.context';
import type { AppliedCoupon } from '@/context/ticket.context';
import './CouponInput.css';

interface CouponInputProps {
  appliedCoupon: AppliedCoupon | null;
  onApplyCoupon: (coupon: AppliedCoupon) => void;
  onRemoveCoupon: () => void;
}

export function CouponInput({ appliedCoupon, onApplyCoupon, onRemoveCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { showToast } = useUI();

  const handleValidate = async () => {
    if (!code.trim()) {
      showToast('Ingresa un código de cupón', 'warning');
      return;
    }

    setIsValidating(true);
    try {
      const result = await couponsService.validate({ code });
      
      if (result.valid && result.code && result.discountType) {
        onApplyCoupon({
          code: result.code,
          name: result.name || result.code,
          discountType: result.discountType,
          discountValue: result.discountValue || 0,
        });
        showToast(result.message, 'success');
        setCode('');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error al validar el cupón', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="coupon-applied">
        <div className="coupon-info">
          <HiOutlineTicket className="coupon-icon" />
          <div className="coupon-details">
            <span className="coupon-name">{appliedCoupon.name}</span>
            <span className="coupon-code">{appliedCoupon.code}</span>
            {appliedCoupon.discountType === 'PERCENTAGE' ? (
              <span className="coupon-value">{appliedCoupon.discountValue}% de descuento</span>
            ) : (
              <span className="coupon-value">€{appliedCoupon.discountValue.toFixed(2)} de descuento</span>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={onRemoveCoupon}
          icon={<HiOutlineX />}
        >
          Quitar
        </Button>
      </div>
    );
  }

  return (
    <div className="coupon-input-container">
      <div className="coupon-input-row">
        <Input
          placeholder="Código de cupón"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleValidate();
            }
          }}
          className="coupon-input"
        />
        <Button
          variant="secondary"
          onClick={handleValidate}
          disabled={isValidating || !code.trim()}
          loading={isValidating}
          icon={<HiOutlineCheck />}
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
