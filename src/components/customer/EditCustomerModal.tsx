import { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer, UpdateCustomerRequest } from '@/types/models';
import './EditCustomerModal.css';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onUpdated: (updatedCustomer: Customer) => void;
}

export function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onUpdated,
}: EditCustomerModalProps) {
  const { showToast } = useUI();
  const [displayName, setDisplayName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string }>({});

  useEffect(() => {
    if (customer && isOpen) {
      setDisplayName(customer.displayName || '');
      setPhone(customer.phone || '');
      setNotes(customer.notes || '');
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { displayName?: string } = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !customer) {
      return;
    }

    setIsSubmitting(true);

    try {
      const request: UpdateCustomerRequest = {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const updatedCustomer = await customersService.update(customer.id, request);
      showToast('Cliente actualizado exitosamente', 'success');
      onUpdated(updatedCustomer);
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al actualizar cliente. Intente nuevamente.';
      showToast(errorMessage, 'error');
      
      // Manejar errores de validación
      if (error?.fieldErrors) {
        const fieldErrors: { displayName?: string } = {};
        if (error.fieldErrors.displayName) {
          fieldErrors.displayName = error.fieldErrors.displayName[0];
        }
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar cliente">
      <form onSubmit={handleSubmit} className="edit-customer-form">
        <div className="edit-customer-fields">
          <Input
            id="displayName"
            label="Nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.displayName}
            required
            disabled={isSubmitting}
            placeholder="Nombre del cliente"
          />

          <Input
            id="phone"
            label="Teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
            placeholder="Teléfono"
          />

          <Textarea
            id="notes"
            label="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            placeholder="Notas sobre el cliente..."
          />
        </div>

        <div className="edit-customer-actions">
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
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
