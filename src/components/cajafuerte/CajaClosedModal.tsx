import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { HiLockClosed, HiOutlineArrowRight } from 'react-icons/hi';
import './CajaClosedModal.css';

interface CajaClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CajaClosedModal({ isOpen, onClose }: CajaClosedModalProps) {
  const navigate = useNavigate();

  const handleGoToCaja = () => {
    onClose();
    navigate('/cajasfuertes');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="No hay Caja Abierta"
      showCloseButton={true}
    >
      <div className="caja-closed-modal">
        <div className="caja-closed-icon">
          <HiLockClosed />
        </div>
        
        <div className="caja-closed-message">
          <p className="caja-closed-title">No hay una caja abierta</p>
          <p className="caja-closed-description">
            No se pueden realizar ventas ni operaciones de dinero sin una caja abierta.
            Ve a la página de Cajas para inicializar o abrir una caja.
          </p>
        </div>

        <div className="caja-closed-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={handleGoToCaja}
            icon={<HiOutlineArrowRight />}
          >
            Ir a Cajas
          </Button>
        </div>
      </div>
    </Modal>
  );
}
