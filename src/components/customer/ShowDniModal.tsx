import { Modal } from '@/components/common/Modal';
import type { Customer } from '@/types/models';
import './ShowDniModal.css';

interface ShowDniModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function ShowDniModal({ isOpen, onClose, customer }: ShowDniModalProps) {
  if (!customer) return null;

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return `${apiBaseUrl}${url}`;
  };

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
              src={getImageUrl(customer.dniPictureUrl) || ''} 
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
