import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import type { SaleDraft } from '@/types/models';
import './DraftRecoveryModal.css';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  draft: SaleDraft | null;
  onRecover: () => void;
  onDiscard: () => void;
}

export function DraftRecoveryModal({ isOpen, draft, onRecover, onDiscard }: DraftRecoveryModalProps) {
  if (!draft) return null;

  const itemsCount = draft.items.length;
  const totalGrams = draft.items.reduce((sum, item) => sum + item.grams, 0);

  return (
    <Modal isOpen={isOpen} onClose={onDiscard} title="Borrador de Venta Encontrado">
      <div className="draft-recovery-modal">
        <div className="draft-recovery-content">
          <p className="draft-recovery-message">
            Se encontró un borrador de venta guardado anteriormente.
          </p>
          
          <div className="draft-recovery-summary">
            {draft.customerId && (
              <div className="draft-recovery-item">
                <span className="draft-recovery-label">Cliente:</span>
                <span className="draft-recovery-value">Seleccionado</span>
              </div>
            )}
            <div className="draft-recovery-item">
              <span className="draft-recovery-label">Productos:</span>
              <span className="draft-recovery-value">{itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}</span>
            </div>
            <div className="draft-recovery-item">
              <span className="draft-recovery-label">Total gramos:</span>
              <span className="draft-recovery-value">{totalGrams.toFixed(2)}g</span>
            </div>
            {draft.cashGiven > 0 && (
              <div className="draft-recovery-item">
                <span className="draft-recovery-label">Efectivo recibido:</span>
                <span className="draft-recovery-value">{formatMoney(draft.cashGiven)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="draft-recovery-actions">
          <Button
            type="button"
            variant="primary"
            onClick={onRecover}
            style={{ flex: 1 }}
          >
            Recuperar Borrador
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onDiscard}
            style={{ flex: 1 }}
          >
            Empezar Nueva Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
