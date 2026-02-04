import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { DenominationSelector } from './DenominationSelector';
import { addMoney } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import type { DenominationsMap } from '@/types/models';
import './AddMoneyModal.css';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMoneyModal({ isOpen, onClose, onSuccess }: AddMoneyModalProps) {
  const { showToast, setGlobalLoading } = useUI();
  const [denominations, setDenominations] = useState<DenominationsMap>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay al menos una denominación
    const hasDenominations = Object.values(denominations).some(qty => qty > 0);
    if (!hasDenominations) {
      showToast('Debes añadir al menos una denominación', 'warning');
      return;
    }

    setIsSubmitting(true);
    setGlobalLoading(true);

    try {
      await addMoney({
        denominations,
        notes: notes.trim() || undefined,
      });
      
      showToast('Dinero añadido exitosamente', 'success');
      setDenominations({});
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
      setDenominations({});
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Añadir dinero a CajaFuerte">
      <form onSubmit={handleSubmit} className="add-money-modal-form">
        <div className="add-money-modal-content">
          <p className="add-money-modal-description">
            Selecciona las denominaciones que deseas añadir a la CajaFuerte.
          </p>
          
          <DenominationSelector
            denominations={denominations}
            onChange={setDenominations}
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
            placeholder="Descripción del ingreso..."
          />
        </div>

        <div className="add-money-modal-actions">
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
            Añadir dinero
          </Button>
        </div>
      </form>
    </Modal>
  );
}
