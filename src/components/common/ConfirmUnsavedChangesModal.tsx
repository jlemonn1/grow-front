import { Modal } from './Modal';
import { Button } from './Button';
import './ConfirmUnsavedChangesModal.css';

interface ConfirmUnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  isSaving?: boolean;
}

export function ConfirmUnsavedChangesModal({
  isOpen,
  onClose,
  onSaveAndExit,
  onExitWithoutSaving,
  isSaving = false,
}: ConfirmUnsavedChangesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="¿Guardar cambios?">
      <div className="confirm-unsaved-changes-content">
        <p className="confirm-unsaved-changes-message">
          Tienes cambios sin guardar. ¿Qué deseas hacer?
        </p>
        <div className="confirm-unsaved-changes-actions">
          <Button
            type="button"
            variant="primary"
            onClick={onSaveAndExit}
            loading={isSaving}
            disabled={isSaving}
          >
            Guardar y salir
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onExitWithoutSaving}
            disabled={isSaving}
          >
            Salir sin guardar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
