import { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/forms/Textarea';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer, UpdateCustomerRequest } from '@/types/models';
import './AddNoteModal.css';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onNoteAdded: (updatedCustomer: Customer) => void;
}

export function AddNoteModal({
  isOpen,
  onClose,
  customer,
  onNoteAdded,
}: AddNoteModalProps) {
  const { showToast } = useUI();
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      // Si ya hay notas, prellenar el campo
      setNote(customer.notes || '');
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customer) {
      return;
    }

    setIsSubmitting(true);

    try {
      const request: UpdateCustomerRequest = {
        notes: note.trim() || undefined,
      };

      const updatedCustomer = await customersService.update(customer.id, request);
      showToast('Nota añadida exitosamente', 'success');
      onNoteAdded(updatedCustomer);
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al añadir nota. Intente nuevamente.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir nota">
      <form onSubmit={handleSubmit} className="add-note-form">
        <div className="add-note-info">
          <p className="add-note-text">
            <strong>Cliente:</strong> {customer.displayName}
          </p>
        </div>

        <div className="add-note-fields">
          <Textarea
            id="note"
            label="Nota"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
            rows={5}
            placeholder="Escribe una nota sobre el cliente..."
            autoFocus
          />
        </div>

        <div className="add-note-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
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
            Guardar nota
          </Button>
        </div>
      </form>
    </Modal>
  );
}
