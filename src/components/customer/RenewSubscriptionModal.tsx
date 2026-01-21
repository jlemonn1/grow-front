import { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { NumberInput } from '@/components/forms/NumberInput';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer, RenewSubscriptionRequest } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './RenewSubscriptionModal.css';

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onRenewed: () => void;
}

export function RenewSubscriptionModal({
  isOpen,
  onClose,
  customer,
  onRenewed,
}: RenewSubscriptionModalProps) {
  const { showToast } = useUI();
  const [subscriptionType, setSubscriptionType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subscriptionPrice?: string }>({});

  useEffect(() => {
    if (customer && isOpen) {
      setSubscriptionType(customer.subscriptionType);
      setSubscriptionPrice(customer.subscriptionPrice);
      setErrors({});
    }
  }, [customer, isOpen]);

  const calculateNewEndDate = (): string => {
    if (!customer) return '';
    
    const currentEndDate = new Date(customer.subscriptionEndDate);
    const newEndDate = new Date(currentEndDate);
    
    if (subscriptionType === 'ANNUAL') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }
    
    return formatDateTime(newEndDate.toISOString());
  };

  const validateForm = (): boolean => {
    const newErrors: { subscriptionPrice?: string } = {};
    
    if (subscriptionPrice < 0.01) {
      newErrors.subscriptionPrice = 'El precio debe ser al menos 0.01';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !customer) {
      return;
    }

    setIsSubmitting(true);

    try {
      const request: RenewSubscriptionRequest = {
        subscriptionType,
        subscriptionPrice,
      };

      await customersService.renewSubscription(customer.id, request);
      showToast('Suscripción renovada exitosamente', 'success');
      onRenewed();
    } catch (error) {
      showToast('Error al renovar suscripción. Intente nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renovar suscripción">
      <form onSubmit={handleSubmit} className="renew-subscription-form">
        <div className="renew-subscription-info">
          <p className="renew-subscription-text">
            La suscripción se renovará desde la fecha de expiración actual:
          </p>
          <p className="renew-subscription-current-date">
            <strong>Fecha actual de expiración:</strong> {formatDateTime(customer.subscriptionEndDate)}
          </p>
          <p className="renew-subscription-new-date">
            <strong>Nueva fecha de expiración:</strong> {calculateNewEndDate()}
          </p>
        </div>

        <div className="renew-subscription-fields">
          <Select
            id="subscriptionType"
            label="Tipo de suscripción"
            value={subscriptionType}
            onChange={(e) => setSubscriptionType(e.target.value as 'MONTHLY' | 'ANNUAL')}
            disabled={isSubmitting}
            options={[
              { value: 'MONTHLY', label: 'Mensual' },
              { value: 'ANNUAL', label: 'Anual' },
            ]}
          />

          <NumberInput
            id="subscriptionPrice"
            label="Precio de suscripción"
            value={subscriptionPrice}
            onChange={setSubscriptionPrice}
            error={errors.subscriptionPrice}
            required
            disabled={isSubmitting}
            min={0.01}
            step={0.01}
            placeholder="0.00"
          />
        </div>

        <div className="renew-subscription-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Renovar suscripción
          </Button>
        </div>
      </form>
    </Modal>
  );
}
