import { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { Textarea } from '@/components/forms/Textarea';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer, TransferBalanceRequest } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './BalanceTransferModal.css';

interface BalanceTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onTransferred: () => void;
}

export function BalanceTransferModal({
  isOpen,
  onClose,
  customer,
  onTransferred,
}: BalanceTransferModalProps) {
  const { showToast } = useUI();
  const [toCustomer, setToCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; toCustomer?: string; notes?: string }>({});

  useEffect(() => {
    if (customer && isOpen) {
      setToCustomer(null);
      setAmount(0);
      setNotes('');
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { amount?: string; toCustomer?: string; notes?: string } = {};
    
    if (!toCustomer) {
      newErrors.toCustomer = 'Debes seleccionar un socio destino';
    } else if (toCustomer.id === customer?.id) {
      newErrors.toCustomer = 'No puedes transferir saldo al mismo socio';
    }

    if (amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    } else if (customer && (customer.balance || 0) < amount) {
      newErrors.amount = `Saldo insuficiente. Saldo disponible: ${formatMoney(customer.balance || 0)}`;
    }

    if (!notes.trim()) {
      newErrors.notes = 'Las notas son obligatorias para transferencias';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !customer || !toCustomer) {
      return;
    }

    setIsSubmitting(true);

    try {
      const request: TransferBalanceRequest = {
        toCustomerId: toCustomer.id,
        amount,
        notes: notes.trim(),
      };

      await customersService.transferBalance(customer.id, request);
      showToast('Saldo transferido exitosamente', 'success');
      onTransferred();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al transferir saldo. Intente nuevamente.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  const currentBalance = customer.balance || 0;
  const newBalance = currentBalance - amount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transferir saldo">
      <form onSubmit={handleSubmit} className="balance-transfer-form">
        <div className="balance-transfer-info">
          <p className="balance-transfer-text">
            <strong>Socio origen:</strong> {customer.displayName}
          </p>
          <p className="balance-transfer-current-balance">
            <strong>Saldo actual:</strong> {formatMoney(currentBalance)}
          </p>
          {amount > 0 && (
            <p className="balance-transfer-new-balance">
              <strong>Saldo después de transferencia:</strong> {formatMoney(newBalance)}
            </p>
          )}
        </div>

        <div className="balance-transfer-fields">
          <div className="balance-transfer-field">
            <label className="balance-transfer-label">
              Socio destino <span className="form-required">*</span>
            </label>
            <CustomerPicker
              selectedCustomer={toCustomer}
              onSelect={setToCustomer}
            />
            {errors.toCustomer && (
              <span className="form-error">{errors.toCustomer}</span>
            )}
          </div>

          <NumberInput
            id="amount"
            label="Monto a transferir"
            value={amount}
            onChange={setAmount}
            error={errors.amount}
            required
            disabled={isSubmitting}
            min={0.01}
            step={0.01}
            placeholder="0.00"
          />

          <Textarea
            id="notes"
            label="Notas (obligatorio)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={errors.notes}
            required
            disabled={isSubmitting}
            rows={3}
            placeholder="Descripción de la transferencia..."
          />
        </div>

        <div className="balance-transfer-actions">
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
            Transferir saldo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
