import { useState, FormEvent, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { Input } from '@/components/forms/Input';
import { useUI } from '@/context/ui.context';
import { useAuth } from '@/context/auth.context';
import { useProducts } from '@/context/products.context';
import { rechargeStock } from '@/services/stock.service';
import { AdminPermission } from '@/types/models';
import type { ValidationError } from '@/types/api';
import './RechargeStockModal.css';

interface RechargeStockModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RechargeStockModal({
  productId,
  productName,
  isOpen,
  onClose,
  onSuccess,
}: RechargeStockModalProps) {
  const { showToast } = useUI();
  const { hasPermission } = useAuth();
  const { updateProductStock } = useProducts();
  
  const [grams, setGrams] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar permiso antes de permitir recargar
  const canRecharge = hasPermission(AdminPermission.GESTIONAR_STOCK);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verificar permiso
    if (!canRecharge) {
      setError('No tienes permiso para gestionar stock');
      showToast('No tienes permiso para gestionar stock', 'error');
      return;
    }

    // Validación
    if (grams <= 0) {
      setError('Los gramos deben ser mayores a 0');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const movement = await rechargeStock(productId, grams, note.trim() || undefined);
      
      // Actualizar stock en el contexto
      updateProductStock(productId, movement.stockAfterGrams);
      
      showToast(`Stock recargado: ${grams.toFixed(2)}g agregados`, 'success');
      
      // Resetear formulario
      setGrams(0);
      setNote('');
      
      // Cerrar modal y notificar éxito
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Manejo de errores de validación (422)
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const firstError = Object.values(apiError.fieldErrors)[0]?.[0];
          setError(firstError || 'Error de validación');
          return;
        }
      }

      // Otros errores
      const errorMessage = err instanceof Error ? err.message : 'Error al recargar stock';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setGrams(0);
      setNote('');
      setError(null);
      onClose();
    }
  };

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  }, []);

  if (!canRecharge) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={`Recargar stock - ${productName}`}>
        <div className="recharge-stock-form">
          <div className="recharge-stock-error" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            No tienes permiso para gestionar stock. Se requiere el permiso GESTIONAR_STOCK.
          </div>
          <div className="recharge-stock-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Recargar stock - ${productName}`}>
      <form onSubmit={handleSubmit} className="recharge-stock-form">
        <NumberInput
          id="grams"
          label="Gramos a agregar"
          value={grams}
          onChange={setGrams}
          min={0.01}
          step={0.01}
          required
          disabled={isSubmitting}
          placeholder="0.00"
          autoFocus
        />

        <Input
          id="note"
          label="Nota (opcional)"
          type="text"
          value={note}
          onChange={handleNoteChange}
          disabled={isSubmitting}
          placeholder="Ej: Reposición semanal"
        />

        {error && <div className="recharge-stock-error">{error}</div>}

        <div className="recharge-stock-actions">
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
            disabled={isSubmitting}
          >
            Recargar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
