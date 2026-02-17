import { Modal } from './Modal';
import { Button } from './Button';
import './ConfirmDeleteModal.css';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
  confirmLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
  confirmLabel,
  variant = 'danger',
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirm-delete-content">
        <p className="confirm-delete-message">
          {message}
          {itemName && (
            <strong className="confirm-delete-item-name"> {itemName}</strong>
          )}
          ?
        </p>
        <p className="confirm-delete-warning">
          Esta acción no se puede deshacer.
        </p>
        <div className="confirm-delete-actions">
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            loading={isDeleting}
            disabled={isDeleting}
          >
            {confirmLabel || 'Eliminar'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
