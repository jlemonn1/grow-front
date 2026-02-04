import { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { Textarea } from '@/components/forms/Textarea';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer, AdjustBalanceRequest } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './BalanceAdjustmentModal.css';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onAdjusted: () => void;
}

export function BalanceAdjustmentModal({
  isOpen,
  onClose,
  customer,
  onAdjusted,
}: BalanceAdjustmentModalProps) {
  const { showToast } = useUI();
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string }>({});

  useEffect(() => {
    if (customer && isOpen) {
      setAmount(0);
      setNotes('');
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { amount?: string } = {};
    
    if (amount === 0) {
      newErrors.amount = 'El monto debe ser diferente de 0';
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
      const request: AdjustBalanceRequest = {
        amount,
        notes: notes.trim() || undefined,
      };

      await customersService.adjustBalance(customer.id, request);
      showToast('Saldo ajustado exitosamente', 'success');
      onAdjusted();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al ajustar saldo. Intente nuevamente.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  const currentBalance = customer.balance || 0;
  const newBalance = currentBalance + amount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustar saldo">
      <form onSubmit={handleSubmit} className="balance-adjustment-form">
        <div className="balance-adjustment-info">
          <p className="balance-adjustment-text">
            <strong>Socio:</strong> {customer.displayName}
          </p>
          <p className="balance-adjustment-current-balance">
            <strong>Saldo actual:</strong> {formatMoney(currentBalance)}
          </p>
          {amount !== 0 && (
            <p className="balance-adjustment-new-balance">
              <strong>Nuevo saldo:</strong> {formatMoney(newBalance)}
            </p>
          )}
        </div>

        <div className="balance-adjustment-fields">
          <NumberInput
            id="amount"
            label="Monto (positivo para agregar, negativo para quitar)"
            value={amount}
            onChange={setAmount}
            error={errors.amount}
            required
            disabled={isSubmitting}
            step={0.01}
            placeholder="0.00"
          />

          <Textarea
            id="notes"
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Descripción del ajuste..."
          />
        </div>

        <div className="balance-adjustment-actions">
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
            {amount > 0 ? 'Agregar saldo' : amount < 0 ? 'Quitar saldo' : 'Ajustar saldo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
