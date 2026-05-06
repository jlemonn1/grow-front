import { Modal } from '@/components/common/Modal';
import { buildCustomerImageUrl } from '@/utils/apiUrl';
import type { Customer } from '@/types/models';
import './ShowDniModal.css';

interface ShowDniModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function ShowDniModal({ isOpen, onClose, customer }: ShowDniModalProps) {
  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Documento Nacional de Identidad">
      <div className="show-dni-modal-content">
        {customer.dniNumber && (
          <div className="show-dni-number">
            <label className="show-dni-label">Número de DNI:</label>
            <span className="show-dni-value">{customer.dniNumber}</span>
          </div>
        )}
        {customer.dniPictureUrl && (
          <div className="show-dni-image-container">
            <img 
              src={buildCustomerImageUrl(customer.dniPictureUrl) || ''} 
              alt="DNI"
              className="show-dni-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        {!customer.dniNumber && !customer.dniPictureUrl && (
          <div className="show-dni-empty">
            <p>No hay información de DNI disponible para este socio.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
