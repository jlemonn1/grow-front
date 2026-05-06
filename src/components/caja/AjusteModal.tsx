import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { NumericKeypad } from '@/components/common/NumericKeypad';
import { useUI } from '@/context/ui.context';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import './AjusteModal.css';

interface AjusteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (monto: number, notas: string) => void;
  tipo: 'entrada' | 'salida';
  saldoActual?: number;
  loading?: boolean;
}

export function AjusteModal({
  isOpen,
  onClose,
  onConfirm,
  tipo,
  saldoActual,
  loading = false,
}: AjusteModalProps) {
  const { showToast } = useUI();
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');

  const handleConfirm = () => {
    const montoValue = parseFloat(monto);
    if (!montoValue || montoValue <= 0) {
      showToast('El monto debe ser mayor que 0', 'warning');
      return;
    }
    if (tipo === 'salida' && saldoActual !== undefined && montoValue > saldoActual) {
      showToast(`Saldo insuficiente. Disponible: ${saldoActual.toFixed(2)}€`, 'warning');
      return;
    }
    onConfirm(montoValue, notas);
    setMonto('');
    setNotas('');
  };

  const handleClose = () => {
    setMonto('');
    setNotas('');
    onClose();
  };

  const titulo = tipo === 'entrada' ? 'Ajuste de Entrada' : 'Ajuste de Salida';
  const descripcion =
    tipo === 'entrada'
      ? 'Añade dinero a la caja (ej: inyección de efectivo)'
      : 'Retira dinero de la caja (ej: para gastos, proveedores)';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={titulo} autoSize={true}>
      <div className="ajuste-modal">
        <p className="ajuste-descripcion">{descripcion}</p>

        {tipo === 'salida' && saldoActual !== undefined && (
          <div className="alerta-info">
            <HiOutlineInformationCircle />
            Saldo disponible: {saldoActual.toFixed(2)}€
          </div>
        )}

        <div className="ajuste-keypad-container">
          <NumericKeypad
            value={monto}
            onChange={setMonto}
            disabled={loading}
            showSubmit={false}
          />
        </div>

        <div className="form-group">
          <label>Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Descripción del ajuste..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={tipo === 'entrada' ? 'primary' : 'danger'}
            onClick={handleConfirm}
            loading={loading}
            disabled={!monto || parseFloat(monto) <= 0}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
