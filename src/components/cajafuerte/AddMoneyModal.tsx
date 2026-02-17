import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { NumericKeypad } from '@/components/common/NumericKeypad';
import { addMoney } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import './AddMoneyModal.css';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMoneyModal({ isOpen, onClose, onSuccess }: AddMoneyModalProps) {
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

    setIsSubmitting(true);
    setGlobalLoading(true);

    try {
      await addMoney({
        amount: amountValue,
        notes: notes.trim() || undefined,
      });
      
      showToast('Dinero añadido exitosamente', 'success');
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Error al añadir dinero',
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Añadir dinero"
      autoSize={true}
    >
      <div className="add-money-layout">
        {/* Sección del teclado */}
        <div className="add-money-keypad-section">
          <NumericKeypad
            value={amount}
            onChange={setAmount}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
          />
        </div>

        {/* Sección de notas */}
        <div className="add-money-notes-section">
          <Textarea
            id="notes"
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={2}
            placeholder="Descripción del ingreso..."
          />
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="add-money-cancel-btn"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
