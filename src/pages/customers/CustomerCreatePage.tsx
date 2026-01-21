import { useState, FormEvent, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlinePhone, HiOutlineDocumentText, HiOutlineKey, HiOutlineCreditCard } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { NumberInput } from '@/components/forms/NumberInput';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { ConfirmUnsavedChangesModal } from '@/components/common/ConfirmUnsavedChangesModal';
import { useUI } from '@/context/ui.context';
import { useCustomers } from '@/context/customers.context';
import { customersService } from '@/services/customers.service';
import type { ValidationError } from '@/types/api';
import './CustomerCreatePage.css';

interface FormData {
  displayName: string;
  phone: string;
  notes: string;
  pin: string;
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  subscriptionPrice: number;
}

interface FormErrors {
  displayName?: string;
  phone?: string;
  notes?: string;
  pin?: string;
  subscriptionPrice?: string;
}

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { addCustomer } = useCustomers();
  
  const initialFormData: FormData = {
    displayName: '',
    phone: '',
    notes: '',
    pin: '',
    subscriptionType: 'MONTHLY',
    subscriptionPrice: 0,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const formDataRef = useRef<FormData>(formData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pinSuggestions, setPinSuggestions] = useState<string[]>([]);
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  // Sincronizar ref con formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const validatePinFormat = (pin: string): boolean => {
    if (!pin || pin.length !== 4) {
      return false;
    }
    let digitCount = 0;
    let letterCount = 0;
    for (const char of pin) {
      if (/\d/.test(char)) {
        digitCount++;
      } else if (/[a-zA-Z]/.test(char)) {
        letterCount++;
      } else {
        return false;
      }
    }
    return digitCount === 2 && letterCount === 2;
  };

  const validateField = (name: keyof FormData, value: string | number): string | undefined => {
    if (name === 'displayName') {
      const strValue = value as string;
      if (!strValue.trim()) {
        return 'El nombre es obligatorio';
      }
      if (strValue.trim().length < 1) {
        return 'El nombre debe tener al menos 1 carácter';
      }
    }
    if (name === 'pin') {
      const strValue = value as string;
      if (!strValue.trim()) {
        return 'El PIN es obligatorio';
      }
      if (!validatePinFormat(strValue)) {
        return 'El PIN debe tener exactamente 2 números y 2 letras';
      }
    }
    if (name === 'subscriptionPrice') {
      const numValue = value as number;
      if (numValue < 0.01) {
        return 'El precio de suscripción debe ser al menos 0.01';
      }
    }
    return undefined;
  };

  const handleChange = useCallback((name: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    // Solo limpiar si el campo tiene errores definidos en FormErrors
    setErrors((prev) => {
      const errorKey = name as keyof FormErrors;
      if (prev[errorKey]) {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prev;
    });

    // Si es el PIN, limpiar sugerencias
    if (name === 'pin') {
      setPinSuggestions([]);
    }
  }, []);

  // Verificar disponibilidad del PIN en tiempo real
  useEffect(() => {
    const checkPinAvailability = async () => {
      const pin = formData.pin.trim().toUpperCase();
      if (!pin || pin.length !== 4 || !validatePinFormat(pin)) {
        setPinSuggestions([]);
        return;
      }

      setIsCheckingPin(true);
      try {
        const result = await customersService.checkPin(pin);
        if (!result.available) {
          setPinSuggestions(result.suggestions);
          if (!errors.pin) {
            setErrors((prev) => ({ ...prev, pin: 'Este PIN ya está en uso' }));
          }
        } else {
          setPinSuggestions([]);
          if (errors.pin === 'Este PIN ya está en uso') {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.pin;
              return newErrors;
            });
          }
        }
      } catch (error) {
        // Error al verificar, no hacer nada
      } finally {
        setIsCheckingPin(false);
      }
    };

    const timer = setTimeout(checkPinAvailability, 500);
    return () => clearTimeout(timer);
  }, [formData.pin]);

  const handleBlur = useCallback((name: keyof FormData) => {
    const value = formDataRef.current[name];
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, []);

  const handlePinSuggestionClick = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, pin: suggestion }));
    setPinSuggestions([]);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.pin;
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const displayNameError = validateField('displayName', formData.displayName);
    if (displayNameError) {
      newErrors.displayName = displayNameError;
    }

    const pinError = validateField('pin', formData.pin);
    if (pinError) {
      newErrors.pin = pinError;
    }

    const priceError = validateField('subscriptionPrice', formData.subscriptionPrice);
    if (priceError) {
      newErrors.subscriptionPrice = priceError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const customer = await customersService.create({
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        pin: formData.pin.trim().toUpperCase(),
        subscriptionType: formData.subscriptionType,
        subscriptionPrice: formData.subscriptionPrice,
      });

      addCustomer(customer);
      showToast('Cliente creado exitosamente', 'success');
      navigate(`/customers/${customer.id}`);
    } catch (error) {
      // Manejo de errores de validación (422)
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: FormErrors = {};
          
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            if (field === 'displayName' || field === 'phone' || field === 'notes' ||
                field === 'pin' || field === 'subscriptionPrice') {
              fieldErrors[field as keyof FormErrors] = messages[0] || 'Error de validación';
            }
          });

          setErrors(fieldErrors);
          
          // Mostrar mensaje general si hay errores
          if (Object.keys(fieldErrors).length > 0) {
            showToast('Por favor, corrige los errores en el formulario', 'error');
          }
          return;
        }
      }

      // Otros errores
      showToast('Error al crear cliente. Intente nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = useMemo(() => {
    return (
      formData.displayName !== initialFormData.displayName ||
      formData.phone !== initialFormData.phone ||
      formData.notes !== initialFormData.notes ||
      formData.pin !== initialFormData.pin ||
      formData.subscriptionType !== initialFormData.subscriptionType ||
      formData.subscriptionPrice !== initialFormData.subscriptionPrice
    );
  }, [formData]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate('/customers');
    }
  };

  const handleSaveAndExit = async () => {
    if (!validateForm()) {
      setShowUnsavedChangesModal(false);
      return;
    }

    setIsSubmitting(true);
    setShowUnsavedChangesModal(false);

    try {
      const customer = await customersService.create({
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        pin: formData.pin.trim().toUpperCase(),
        subscriptionType: formData.subscriptionType,
        subscriptionPrice: formData.subscriptionPrice,
      });

      addCustomer(customer);
      showToast('Cliente creado exitosamente', 'success');
      navigate('/customers');
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: FormErrors = {};
          
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            if (field === 'displayName' || field === 'phone' || field === 'notes' ||
                field === 'pin' || field === 'subscriptionPrice') {
              fieldErrors[field as keyof FormErrors] = messages[0] || 'Error de validación';
            }
          });

          setErrors(fieldErrors);
          
          if (Object.keys(fieldErrors).length > 0) {
            showToast('Por favor, corrige los errores en el formulario', 'error');
          }
        }
      } else {
        showToast('Error al crear cliente. Intente nuevamente.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    navigate('/customers');
  };

  return (
    <>
      <PageHeader title="Nuevo cliente" onBack={handleBack} />
      <div className="customer-create-container">
        <FormCard>
          <form onSubmit={handleSubmit} className="customer-create-form">
            <FormSection
              title="Información del cliente"
              description="Datos principales del cliente"
            >
              <div className="form-row">
                <div className="form-field-with-icon">
                  <HiOutlineUser className="form-field-icon" />
                  <Input
                    id="displayName"
                    label="Nombre completo"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    onBlur={() => handleBlur('displayName')}
                    error={errors.displayName}
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="form-field-with-icon">
                  <HiOutlinePhone className="form-field-icon" />
                  <Input
                    id="phone"
                    label="Teléfono"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    error={errors.phone}
                    disabled={isSubmitting}
                    placeholder="Ej: +54 11 1234-5678"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="PIN y Suscripción"
              description="PIN único del cliente y configuración de suscripción"
            >
              <div className="form-row">
                <div className="form-field-with-icon">
                  <HiOutlineKey className="form-field-icon" />
                  <Input
                    id="pin"
                    label="PIN"
                    type="text"
                    value={formData.pin}
                    onChange={(e) => handleChange('pin', e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('pin')}
                    error={errors.pin}
                    required
                    disabled={isSubmitting || isCheckingPin}
                    placeholder="Ej: 12AB"
                    maxLength={4}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {isCheckingPin && (
                    <span className="pin-checking">Verificando...</span>
                  )}
                  {pinSuggestions.length > 0 && (
                    <div className="pin-suggestions">
                      <span className="pin-suggestions-label">PINs disponibles sugeridos:</span>
                      <div className="pin-suggestions-list">
                        {pinSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="pin-suggestion-button"
                            onClick={() => handlePinSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-field-with-icon">
                  <HiOutlineCreditCard className="form-field-icon" />
                  <Select
                    id="subscriptionType"
                    label="Tipo de suscripción"
                    value={formData.subscriptionType}
                    onChange={(e) => handleChange('subscriptionType', e.target.value as 'MONTHLY' | 'ANNUAL')}
                    disabled={isSubmitting}
                    options={[
                      { value: 'MONTHLY', label: 'Mensual' },
                      { value: 'ANNUAL', label: 'Anual' },
                    ]}
                  />
                </div>
                <div className="form-field-with-icon">
                  <HiOutlineCreditCard className="form-field-icon" />
                  <NumberInput
                    id="subscriptionPrice"
                    label="Precio de suscripción"
                    value={formData.subscriptionPrice}
                    onChange={(value) => handleChange('subscriptionPrice', value)}
                    onBlur={() => handleBlur('subscriptionPrice')}
                    error={errors.subscriptionPrice}
                    required
                    disabled={isSubmitting}
                    min={0.01}
                    step={0.01}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Notas adicionales"
              description="Información adicional sobre el cliente (opcional)"
            >
              <div className="form-field-with-icon">
                <HiOutlineDocumentText className="form-field-icon" />
                <Textarea
                  id="notes"
                  label="Notas"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  onBlur={() => handleBlur('notes')}
                  error={errors.notes}
                  disabled={isSubmitting}
                  placeholder="Información adicional sobre el cliente..."
                  rows={4}
                />
              </div>
            </FormSection>

            <div className="customer-create-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
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
                Guardar cliente
              </Button>
            </div>
          </form>
        </FormCard>
      </div>
      <ConfirmUnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
        isSaving={isSubmitting}
      />
    </>
  );
}
