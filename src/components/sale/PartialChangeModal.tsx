import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import { getDenominationLabel } from '@/utils/denominations';
import type { DenominationsMap } from '@/types/models';
import { HiExclamationTriangle, HiCheckCircle } from 'react-icons/hi2';
import './PartialChangeModal.css';

interface PartialChangeModalProps {
  isOpen: boolean;
  changeAmount: number;
  changeDenominations: DenominationsMap;
  remainingAmount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PartialChangeModal({
  isOpen,
  changeAmount,
  changeDenominations,
  remainingAmount,
  onConfirm,
  onCancel,
}: PartialChangeModalProps) {
  const changeGiven = Object.entries(changeDenominations)
    .filter(([_, qty]) => qty > 0)
    .reduce((sum, [denomination, qty]) => sum + parseFloat(denomination) * qty, 0);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Cambio Parcial Disponible">
      <div className="partial-change-modal">
        <div className="partial-change-icon">
          <HiExclamationTriangle />
        </div>

        <div className="partial-change-content">
          <p className="partial-change-message">
            No hay suficientes denominaciones en la caja para dar el cambio completo de{' '}
            <strong>{formatMoney(changeAmount)}</strong>.
          </p>

          <div className="partial-change-details">
            <div className="partial-change-section">
              <div className="partial-change-section-header">
                <HiCheckCircle className="partial-change-section-icon" />
                <h4>Cambio a dar en efectivo:</h4>
              </div>
              <div className="partial-change-amount">{formatMoney(changeGiven)}</div>
              <div className="partial-change-denominations">
                {Object.entries(changeDenominations)
                  .filter(([_, qty]) => qty > 0)
                  .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                  .map(([denomination, qty]) => (
                    <div key={denomination} className="partial-change-denomination-item">
                      <span className="partial-change-quantity">{qty}x</span>
                      <span className="partial-change-label">{getDenominationLabel(parseFloat(denomination))}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="partial-change-section">
              <div className="partial-change-section-header">
                <HiCheckCircle className="partial-change-section-icon" />
                <h4>Restante a añadir al saldo:</h4>
              </div>
              <div className="partial-change-amount partial-change-remaining">{formatMoney(remainingAmount)}</div>
              <p className="partial-change-note">
                Esta cantidad se añadirá automáticamente al saldo del cliente.
              </p>
            </div>
          </div>
        </div>

        <div className="partial-change-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Confirmar Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
}
