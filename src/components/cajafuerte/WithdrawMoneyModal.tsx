import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { DenominationSelector } from './DenominationSelector';
import { withdrawMoney } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import type { DenominationsMap, CajaFuerte } from '@/types/models';
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
  const [denominations, setDenominations] = useState<DenominationsMap>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay al menos una denominación
    const hasDenominations = Object.values(denominations).some(qty => qty > 0);
    if (!hasDenominations) {
      showToast('Debes seleccionar al menos una denominación', 'warning');
      return;
    }

    setIsSubmitting(true);
    setGlobalLoading(true);

    try {
      await withdrawMoney({
        denominations,
        notes: notes.trim() || undefined,
      });
      
      showToast('Dinero retirado exitosamente', 'success');
      setDenominations({});
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
      setDenominations({});
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Retirar dinero de CajaFuerte">
      <form onSubmit={handleSubmit} className="withdraw-money-modal-form">
        <div className="withdraw-money-modal-content">
          <p className="withdraw-money-modal-description">
            Selecciona las denominaciones que deseas retirar de la CajaFuerte.
          </p>
          
          <DenominationSelector
            denominations={denominations}
            onChange={setDenominations}
            availableDenominations={currentState.denominations}
            disabled={isSubmitting}
            showTotal={true}
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
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Retirar dinero
          </Button>
        </div>
      </form>
    </Modal>
  );
}
