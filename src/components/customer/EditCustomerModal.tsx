import { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { NumberInput } from '@/components/forms/NumberInput';
import { SegmentedToggle } from '@/components/forms/SegmentedToggle';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer, UpdateCustomerRequest } from '@/types/models';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import { HiLocationMarker, HiChartBar, HiUsers } from 'react-icons/hi';
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
  const [address, setAddress] = useState<string>('');
  const [estimatedMonthlyConsumptionGrams, setEstimatedMonthlyConsumptionGrams] = useState<number>(100);
  const [selectedGuarantor, setSelectedGuarantor] = useState<Customer | null>(null);
  const [customerType, setCustomerType] = useState<'LUDICO' | 'TERAPEUTICO'>('LUDICO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    address?: string;
    estimatedMonthlyConsumptionGrams?: string;
    guarantor?: string;
  }>({});

  const buildGuarantorPlaceholder = (id: string, name?: string): Customer => ({
    id,
    displayName: name || 'Socio aval',
    phone: '',
    notes: undefined,
    pin: '',
    subscriptionType: 'MONTHLY',
    subscriptionPrice: 0,
    subscriptionStartDate: new Date().toISOString(),
    subscriptionEndDate: new Date().toISOString(),
    balance: 0,
    createdAt: new Date().toISOString(),
    profilePictureUrl: undefined,
    dniPictureUrl: undefined,
    dniNumber: undefined,
    address: undefined,
    estimatedMonthlyConsumptionGrams: undefined,
    guarantorId: undefined,
    guarantorDisplayName: undefined,
    guarantorStatus: undefined,
    contractSignedAt: undefined,
    contractSignatureUrl: undefined,
    customerType: 'LUDICO',
  });

  useEffect(() => {
    if (customer && isOpen) {
      setDisplayName(customer.displayName || '');
      setPhone(customer.phone || '');
      setNotes(customer.notes || '');
      setAddress(customer.address || '');
      setEstimatedMonthlyConsumptionGrams(customer.estimatedMonthlyConsumptionGrams ?? 100);
      setCustomerType(customer.customerType || 'LUDICO');
      setSelectedGuarantor(
        customer.guarantorId
          ? buildGuarantorPlaceholder(customer.guarantorId, customer.guarantorDisplayName)
          : null
      );
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: {
      displayName?: string;
      address?: string;
      estimatedMonthlyConsumptionGrams?: string;
      guarantor?: string;
    } = {};
    
    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre es obligatorio';
    }

    if (!address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    }

    if (!Number.isFinite(estimatedMonthlyConsumptionGrams) || estimatedMonthlyConsumptionGrams <= 0) {
      newErrors.estimatedMonthlyConsumptionGrams = 'La previsión debe ser mayor a 0';
    }

    if (!selectedGuarantor) {
      newErrors.guarantor = 'Selecciona un socio aval';
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
        address: address.trim() || undefined,
        estimatedMonthlyConsumptionGrams,
        guarantorId: selectedGuarantor?.id || null,
        customerType,
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
          const fieldErrors: {
            displayName?: string;
            address?: string;
            estimatedMonthlyConsumptionGrams?: string;
            guarantor?: string;
          } = {};
          if (error.fieldErrors.displayName) {
            fieldErrors.displayName = error.fieldErrors.displayName[0];
          }
          if (error.fieldErrors.address) {
            fieldErrors.address = error.fieldErrors.address[0];
          }
          if (error.fieldErrors.estimatedMonthlyConsumptionGrams) {
            fieldErrors.estimatedMonthlyConsumptionGrams = error.fieldErrors.estimatedMonthlyConsumptionGrams[0];
          }
          if (error.fieldErrors.guarantorId) {
            fieldErrors.guarantor = error.fieldErrors.guarantorId[0];
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

          <div className="edit-advanced-fields">
            <div className="form-field-with-icon">
              <HiLocationMarker className="form-field-icon" />
              <Input
                id="address"
                label="Dirección"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSubmitting}
                placeholder="Calle, número, ciudad"
                error={errors.address}
              />
            </div>
            <div className="form-field-with-icon">
              <HiChartBar className="form-field-icon" />
              <NumberInput
                id="estimatedMonthlyConsumptionGrams"
                label="Consumo estimado (g/mes)"
                value={estimatedMonthlyConsumptionGrams}
                onChange={(value) => setEstimatedMonthlyConsumptionGrams(value)}
                disabled={isSubmitting}
                min={1}
                step={1}
                error={errors.estimatedMonthlyConsumptionGrams}
              />
            </div>
          </div>

          <SegmentedToggle
            id="customerType"
            label="Tipo de socio"
            value={customerType}
            onChange={(value) => setCustomerType(value)}
            options={[
              { value: 'LUDICO', label: 'Lúdico' },
              { value: 'TERAPEUTICO', label: 'Terapéutico' },
            ]}
            disabled={isSubmitting}
          />

          <div className="edit-guarantor-block">
            <div className="guarantor-picker-header">
              <HiUsers className="form-field-icon" />
              <span>Selecciona un socio aval</span>
            </div>
            <CustomerPicker
              selectedCustomer={selectedGuarantor}
              onSelect={(customer) => setSelectedGuarantor(customer)}
            />
            {errors.guarantor && (
              <p className="form-error guarantor-error">{errors.guarantor}</p>
            )}
          </div>

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
