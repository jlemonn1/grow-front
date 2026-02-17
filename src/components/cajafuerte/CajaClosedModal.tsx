import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { reopenDay } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import { HiLockClosed, HiLockOpen } from 'react-icons/hi2';
import './CajaClosedModal.css';

interface CajaClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReopenSuccess: () => void;
}

export function CajaClosedModal({ isOpen, onClose, onReopenSuccess }: CajaClosedModalProps) {
  const { showToast, setGlobalLoading } = useUI();
  const [isReopening, setIsReopening] = useState(false);

  const handleReopen = async () => {
    setIsReopening(true);
    setGlobalLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await reopenDay({ date: today });
      
      showToast('Caja reabierta exitosamente', 'success');
      onReopenSuccess();
      onClose();
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Error al reabrir la caja',
        'error'
      );
    } finally {
      setIsReopening(false);
      setGlobalLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isReopening) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Caja Cerrada"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="caja-closed-modal">
        <div className="caja-closed-icon">
          <HiLockClosed />
        </div>
        
        <div className="caja-closed-message">
          <p className="caja-closed-title">La caja está cerrada</p>
          <p className="caja-closed-description">
            No se pueden realizar operaciones de entrada o salida de dinero mientras la caja esté cerrada.
          </p>
        </div>

        <div className="caja-closed-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isReopening}
            className="caja-closed-cancel-btn"
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={handleReopen}
            loading={isReopening}
            disabled={isReopening}
            icon={<HiLockOpen />}
            className="caja-closed-reopen-btn"
          >
            Abrir Caja
          </Button>
        </div>
      </div>
    </Modal>
  );
}
