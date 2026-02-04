import { useState, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { DenominationSelector } from './DenominationSelector';
import { changeDenominations } from '@/services/cajafuerte.service';
import { calculateTotal } from '@/utils/denominations';
import { useUI } from '@/context/ui.context';
import type { DenominationsMap, CajaFuerte } from '@/types/models';
import './ChangeDenominationsModal.css';

interface ChangeDenominationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentState: CajaFuerte;
}

export function ChangeDenominationsModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentState 
}: ChangeDenominationsModalProps) {
  const { showToast, setGlobalLoading } = useUI();
  const [fromDenominations, setFromDenominations] = useState<DenominationsMap>({});
  const [toDenominations, setToDenominations] = useState<DenominationsMap>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromTotal = useMemo(() => calculateTotal(fromDenominations), [fromDenominations]);
  const toTotal = useMemo(() => calculateTotal(toDenominations), [toDenominations]);
  const totalsMatch = Math.abs(fromTotal - toTotal) < 0.01; // Tolerancia para decimales

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay denominaciones en ambos lados
    const hasFrom = Object.values(fromDenominations).some(qty => qty > 0);
    const hasTo = Object.values(toDenominations).some(qty => qty > 0);
    
    if (!hasFrom) {
      showToast('Debes seleccionar denominaciones de origen', 'warning');
      return;
    }
    
    if (!hasTo) {
      showToast('Debes seleccionar denominaciones de destino', 'warning');
      return;
    }

    if (!totalsMatch) {
      showToast('Las cantidades totales deben coincidir', 'warning');
      return;
    }

    setIsSubmitting(true);
    setGlobalLoading(true);

    try {
      await changeDenominations({
        fromDenominations,
        toDenominations,
        notes: notes.trim() || undefined,
      });
      
      showToast('Denominaciones cambiadas exitosamente', 'success');
      setFromDenominations({});
      setToDenominations({});
      setNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Error al cambiar denominaciones',
        'error'
      );
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFromDenominations({});
      setToDenominations({});
      setNotes('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar denominaciones">
      <form onSubmit={handleSubmit} className="change-denominations-modal-form">
        <div className="change-denominations-modal-content">
          <p className="change-denominations-modal-description">
            Intercambia denominaciones manteniendo el mismo monto total. 
            Selecciona las denominaciones que retiras y las que añades.
          </p>
          
          <div className="change-denominations-sections">
            <div className="change-denominations-section">
              <h3 className="change-denominations-section-title">Retirar (Origen)</h3>
              <DenominationSelector
                denominations={fromDenominations}
                onChange={setFromDenominations}
                availableDenominations={currentState.denominations}
                disabled={isSubmitting}
                showTotal={true}
              />
            </div>

            <div className="change-denominations-section">
              <h3 className="change-denominations-section-title">Añadir (Destino)</h3>
              <DenominationSelector
                denominations={toDenominations}
                onChange={setToDenominations}
                disabled={isSubmitting}
                showTotal={true}
              />
            </div>
          </div>

          <div className="change-denominations-totals">
            <div className={`change-denominations-total ${!totalsMatch ? 'change-denominations-total-error' : ''}`}>
              <span>Total origen: €{fromTotal.toFixed(2)}</span>
              <span>Total destino: €{toTotal.toFixed(2)}</span>
              {!totalsMatch && (
                <span className="change-denominations-total-warning">
                  Las cantidades deben coincidir
                </span>
              )}
            </div>
          </div>

          <Textarea
            id="notes"
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Descripción del cambio..."
          />
        </div>

        <div className="change-denominations-modal-actions">
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
            disabled={isSubmitting || !totalsMatch}
          >
            Cambiar denominaciones
          </Button>
        </div>
      </form>
    </Modal>
  );
}
