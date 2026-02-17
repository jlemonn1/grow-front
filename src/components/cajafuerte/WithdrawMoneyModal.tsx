import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { NumericKeypad } from '@/components/common/NumericKeypad';
import { withdrawMoney } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import { formatMoney } from '@/utils/money';
import type { CajaFuerte } from '@/types/models';
import './WithdrawMoneyModal.css';

interface WithdrawMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentState: CajaFuerte;
}

export function WithdrawMoneyModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentState 
}: WithdrawMoneyModalProps) {
  const { showToast, setGlobalLoading } = useUI();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      showToast('Debes ingresar un monto válido', 'warning');
      return;
    }

    if (amountValue > currentState.totalAmount) {
      showToast('Saldo insuficiente en CajaFuerte', 'error');
      return;
    }

    setIsSubmitting(true);
    setGlobalLoading(true);

    try {
      await withdrawMoney({
        amount: amountValue,
        notes: notes.trim() || undefined,
      });
      
      showToast('Dinero retirado exitosamente', 'success');
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Error al retirar dinero',
        'error'
      );
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setNotes('');
      onClose();
    }
  };

  const numericAmount = parseFloat(amount) || 0;
  const hasError = numericAmount > currentState.totalAmount;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Retirar dinero" autoSize={true}>
      <div className="withdraw-money-modal-form">
        <div className="withdraw-money-modal-content">
          <p className="withdraw-money-modal-description">
            Saldo disponible: <strong>{formatMoney(currentState.totalAmount)}</strong>
          </p>
          <p className="withdraw-money-modal-description">
            Ingresa el monto que deseas retirar.
          </p>
          
          {hasError && (
            <div className="withdraw-money-modal-error">
              El monto excede el saldo disponible
            </div>
          )}
          
          <NumericKeypad
            value={amount}
            onChange={setAmount}
            onSubmit={handleSubmit}
            maxValue={currentState.totalAmount}
            disabled={isSubmitting}
          />

          <Textarea
            id="notes"
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Descripción del retiro..."
          />
        </div>

        <div className="withdraw-money-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
