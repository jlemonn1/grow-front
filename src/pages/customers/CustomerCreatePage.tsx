import { useState, FormEvent, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlinePhone, HiOutlineDocumentText, HiOutlineKey, HiOutlineCreditCard, HiLocationMarker, HiChartBar, HiUsers, HiCamera, HiCheck, HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { NumberInput } from '@/components/forms/NumberInput';
import { SegmentedToggle } from '@/components/forms/SegmentedToggle';
import { ConfirmUnsavedChangesModal } from '@/components/common/ConfirmUnsavedChangesModal';
import { ContractSignatureModal } from '@/components/customer/ContractSignatureModal';
import { CameraModal } from '@/components/customer/CameraModal';
import { useUI } from '@/context/ui.context';
import { useCustomers } from '@/context/customers.context';
import { customersService } from '@/services/customers.service';
import type { ValidationError } from '@/types/api';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import type { Customer } from '@/types/models';
import './CustomerCreatePage.css';

interface FormData {
  displayName: string;
  phone: string;
  notes: string;
  pin: string;
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  subscriptionPrice: number;
  address: string;
  estimatedMonthlyConsumptionGrams: number;
  customerType: 'LUDICO' | 'TERAPEUTICO';
}

interface FormErrors {
  displayName?: string;
  phone?: string;
  notes?: string;
  pin?: string;
  subscriptionPrice?: string;
  address?: string;
  estimatedMonthlyConsumptionGrams?: string;
  guarantor?: string;
}

type Step = 0 | 1 | 2;

const STEPS = [
  { id: 0 as Step, title: 'Básico', fields: ['displayName', 'phone', 'address'] as (keyof FormData)[] },
  { id: 1 as Step, title: 'PIN y Suscripción', fields: ['pin', 'subscriptionType', 'subscriptionPrice'] as (keyof FormData)[] },
  { id: 2 as Step, title: 'Tipo y Consumo', fields: ['customerType', 'estimatedMonthlyConsumptionGrams'] as (keyof FormData)[] },
];

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
    address: '',
    estimatedMonthlyConsumptionGrams: 100,
    customerType: 'LUDICO',
  };

  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const formDataRef = useRef<FormData>(formData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pinSuggestions, setPinSuggestions] = useState<string[]>([]);
  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [dniPicture, setDniPicture] = useState<File | null>(null);
  const [dniNumber, setDniNumber] = useState<string>('');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [dniPicturePreview, setDniPicturePreview] = useState<string | null>(null);
  const [selectedGuarantor, setSelectedGuarantor] = useState<Customer | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractSignatureDataUrl, setContractSignatureDataUrl] = useState<string | null>(null);
  const [pendingSubmitAction, setPendingSubmitAction] = useState<'detail' | 'list' | null>(null);
  const [isProfileCameraOpen, setIsProfileCameraOpen] = useState(false);
  const [isDniCameraOpen, setIsDniCameraOpen] = useState(false);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const guarantorIsActive = useMemo(() => {
    if (!selectedGuarantor) return true;
    if (!selectedGuarantor.subscriptionEndDate) return true;
    return new Date(selectedGuarantor.subscriptionEndDate) >= new Date();
  }, [selectedGuarantor]);

  const validatePinFormat = (pin: string): boolean => {
    if (!pin || pin.length < 2 || pin.length > 8) {
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
    // Debe tener al menos una letra, puede tener números pero no solo números
    return letterCount >= 1;
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
        return 'El PIN debe tener entre 2 y 8 caracteres, con al menos una letra';
      }
    }
    if (name === 'subscriptionPrice') {
      const numValue = value as number;
      if (numValue < 0.01) {
        return 'El precio de suscripción debe ser al menos 0.01';
      }
    }
    if (name === 'phone') {
      const strValue = value as string;
      if (!strValue.trim()) {
        return 'El teléfono es obligatorio';
      }
    }
    if (name === 'estimatedMonthlyConsumptionGrams') {
      const numValue = value as number;
      if (!Number.isFinite(numValue) || numValue <= 0) {
        return 'La previsión debe ser mayor a 0';
      }
    }
    return undefined;
  };

  const validateStep = (step: Step): FormErrors => {
    const stepErrors: FormErrors = {};
    const stepConfig = STEPS.find(s => s.id === step);
    if (!stepConfig) return stepErrors;

    for (const field of stepConfig.fields) {
      const value = formData[field];
      const error = validateField(field, value);
      if (error) {
        (stepErrors as Record<string, string>)[field] = error;
      }
    }

    if (step === 2 && !selectedGuarantor) {
      stepErrors.guarantor = 'Selecciona un socio aval';
    } else if (step === 2 && selectedGuarantor && !guarantorIsActive) {
      stepErrors.guarantor = 'El aval debe tener la suscripción activa';
    }

    return stepErrors;
  };

  const stepErrors = useMemo(() => {
    return STEPS.reduce((acc, step) => {
      acc[step.id] = validateStep(step.id);
      return acc;
    }, {} as Record<Step, FormErrors>);
  }, [formData, selectedGuarantor, guarantorIsActive]);

  const isStepComplete = (step: Step): boolean => {
    return Object.keys(stepErrors[step] || {}).length === 0;
  };

  const getCompletedSteps = (): Step[] => {
    return STEPS.filter(s => s.id < currentStep && isStepComplete(s.id)).map(s => s.id) as Step[];
  };

  const handleChange = useCallback((name: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    setErrors((prev) => {
      const errorKey = name as keyof FormErrors;
      if (prev[errorKey]) {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      }
      return prev;
    });

    if (name === 'pin') {
      setPinSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const checkPinAvailability = async () => {
      const pin = formData.pin.trim().toUpperCase();
      if (!pin || pin.length < 2 || pin.length > 6 || !validatePinFormat(pin)) {
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
      } finally {
        setIsCheckingPin(false);
      }
    };

    const timer = setTimeout(checkPinAvailability, 500);
    return () => clearTimeout(timer);
  }, [formData.pin, errors.pin]);

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

  const handleNext = () => {
    const currentErrors = stepErrors[currentStep];
    if (currentErrors && Object.keys(currentErrors).length > 0) {
      const firstErrorField = Object.keys(currentErrors)[0] as keyof FormErrors;
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
      element?.focus();
      showToast('Completa los campos requeridos antes de continuar', 'error');
      return;
    }

    if (currentStep < 2) {
      setCurrentStep(prev => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => (prev - 1) as Step);
    }
  };

  const handleGoToStep = (step: Step) => {
    if (step <= currentStep || getCompletedSteps().includes(step - 1 as Step)) {
      setCurrentStep(step);
    }
  };

  const handleProfileCameraCapture = (file: File) => {
    setProfilePicture(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDniCameraCapture = (file: File) => {
    setDniPicture(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDniPicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  const removeDniPicture = () => {
    setDniPicture(null);
    setDniPicturePreview(null);
  };

  const applyApiErrors = useCallback((apiError: ValidationError) => {
    const fieldErrors: FormErrors = {};

    Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
      if (
        field === 'displayName' ||
        field === 'phone' ||
        field === 'notes' ||
        field === 'pin' ||
        field === 'subscriptionPrice' ||
        field === 'address' ||
        field === 'estimatedMonthlyConsumptionGrams'
      ) {
        fieldErrors[field as keyof FormErrors] = messages[0] || 'Error de validación';
      }
      if (field === 'guarantorId') {
        fieldErrors.guarantor = messages[0] || 'Error de validación';
      }
    });

    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      showToast('Por favor, corrige los errores en el formulario', 'error');
    }
  }, [showToast]);

  const handleServiceError = useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ValidationError;
      if (apiError.status === 422 && apiError.fieldErrors) {
        applyApiErrors(apiError);
        return;
      }
    }
    showToast('Error al crear socio. Intente nuevamente.', 'error');
  }, [applyApiErrors, showToast]);

  const submitCustomer = useCallback(async (signedDataUrl: string | null, returnToList: boolean) => {
    setIsSubmitting(true);
    try {
      const currentForm = formDataRef.current;
      const sanitizedConsumption = Number(currentForm.estimatedMonthlyConsumptionGrams);
      const customer = await customersService.create({
        displayName: currentForm.displayName.trim(),
        phone: currentForm.phone.trim() || undefined,
        notes: currentForm.notes.trim() || undefined,
        pin: currentForm.pin.trim().toUpperCase(),
        subscriptionType: currentForm.subscriptionType,
        subscriptionPrice: currentForm.subscriptionPrice,
        profilePicture: profilePicture || undefined,
        dniPicture: dniPicture || undefined,
        dniNumber: dniNumber.trim() || undefined,
        address: currentForm.address.trim() || undefined,
        estimatedMonthlyConsumptionGrams: Number.isFinite(sanitizedConsumption)
          ? sanitizedConsumption
          : undefined,
        guarantorId: selectedGuarantor?.id,
        contractSignatureDataUrl: signedDataUrl ?? undefined,
        customerType: currentForm.customerType,
      });

      addCustomer(customer);
      showToast('Socio creado exitosamente', 'success');
      navigate(returnToList ? '/customers' : `/customers/${customer.id}`);
    } catch (error) {
      handleServiceError(error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmitAction(null);
    }
  }, [addCustomer, dniNumber, dniPicture, navigate, profilePicture, selectedGuarantor, handleServiceError, showToast]);

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    for (const step of STEPS) {
      if (step.id < 2) {
        const errors = stepErrors[step.id];
        if (errors && Object.keys(errors).length > 0) {
          setCurrentStep(step.id);
          showToast('Completa todos los campos requeridos', 'error');
          return;
        }
      }
    }

    if (!contractSignatureDataUrl) {
      setPendingSubmitAction('detail');
      setIsContractModalOpen(true);
      return;
    }

    void submitCustomer(contractSignatureDataUrl, false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate('/customers');
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    return (
      formData.displayName !== initialFormData.displayName ||
      formData.phone !== initialFormData.phone ||
      formData.notes !== initialFormData.notes ||
      formData.pin !== initialFormData.pin ||
      formData.subscriptionType !== initialFormData.subscriptionType ||
      formData.subscriptionPrice !== initialFormData.subscriptionPrice ||
      formData.address !== initialFormData.address ||
      formData.estimatedMonthlyConsumptionGrams !== initialFormData.estimatedMonthlyConsumptionGrams ||
      profilePicture !== null ||
      dniPicture !== null ||
      dniNumber !== '' ||
      selectedGuarantor !== null ||
      contractSignatureDataUrl !== null
    );
  }, [formData, profilePicture, dniPicture, dniNumber, selectedGuarantor, contractSignatureDataUrl]);

  const handleBackButton = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate('/customers');
    }
  };

  const handleSaveAndExit = () => {
    setShowUnsavedChangesModal(false);
    navigate('/customers');
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    navigate('/customers');
  };

  const handleContractModalClose = () => {
    setIsContractModalOpen(false);
    setPendingSubmitAction(null);
  };

  const handleContractSigned = (dataUrl: string) => {
    setContractSignatureDataUrl(dataUrl);
    setIsContractModalOpen(false);
    
    if (pendingSubmitAction === 'detail') {
      void submitCustomer(dataUrl, false);
    } else if (pendingSubmitAction === 'list') {
      void submitCustomer(dataUrl, true);
    }
    setPendingSubmitAction(null);
  };

  const getStepSummary = (step: Step): string => {
    switch (step) {
      case 0:
        return formData.displayName ? `• ${formData.displayName}` : 'Sin nombre';
      case 1:
        return formData.pin ? `• PIN: ${formData.pin}` : 'Sin PIN';
      case 2:
        return formData.customerType === 'LUDICO' ? '• Lúdico' : '• Terapéutico';
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <h2 className="step-title">Información básica</h2>
            <p className="step-description">Datos principales del socio</p>
            
            <div className="step-form">
              <div className="customer-info-header">
                <div className="customer-avatar-block">
                  <label className="form-label">Foto de perfil</label>
                  <div className="customer-avatar-preview">
                    {profilePicturePreview ? (
                      <>
                        <img src={profilePicturePreview} alt="Vista previa" />
                        <button
                          type="button"
                          className="customer-avatar-remove"
                          onClick={removeProfilePicture}
                          aria-label="Eliminar foto de perfil"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span>Vista previa</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsProfileCameraOpen(true)}
                    icon={<HiCamera />}
                  >
                    Tomar foto
                  </Button>
                </div>

                <div className="customer-basic-fields">
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
                      placeholder="Ej: Juan García"
                      data-tour="customer-name-input"
                      autoFocus
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
                      required
                      disabled={isSubmitting}
                      placeholder="Ej: 612 345 678"
                      data-tour="customer-phone-input"
                    />
                  </div>

                  <div className="form-field-with-icon">
                    <HiLocationMarker className="form-field-icon" />
                    <Input
                      id="address"
                      label="Dirección"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      onBlur={() => handleBlur('address')}
                      error={errors.address}
                      disabled={isSubmitting}
                      placeholder="Ej: Calle Mayor 123"
                      data-tour="customer-address-input"
                    />
                  </div>
                </div>
              </div>

              <div className="dni-section">
                <label className="form-label">Foto del DNI (opcional)</label>
                <div className="dni-picture-container">
                  {dniPicturePreview ? (
                    <>
                      <img src={dniPicturePreview} alt="Vista previa DNI" className="dni-preview-img" />
                      <button
                        type="button"
                        className="dni-remove-button"
                        onClick={removeDniPicture}
                        aria-label="Eliminar foto del DNI"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsDniCameraOpen(true)}
                      icon={<HiCamera />}
                    >
                      Tomar foto del DNI
                    </Button>
                  )}
                </div>
                <div className="form-field-with-icon">
                  <HiOutlineDocumentText className="form-field-icon" />
                  <Input
                    id="dniNumber"
                    label="Número de DNI"
                    type="text"
                    value={dniNumber}
                    onChange={(e) => setDniNumber(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Ej: 12345678"
                  />
                </div>
              </div>

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
                  placeholder="Información adicional sobre el socio..."
                  rows={3}
                  data-tour="customer-notes-input"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">PIN y Suscripción</h2>
            <p className="step-description">PIN único del socio y configuración de suscripción</p>
            
            <div className="step-form">
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
                  maxLength={8}
                  style={{ textTransform: 'uppercase' }}
                  data-tour="customer-pin-input"
                  autoFocus
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

              <div className="form-field-with-icon form-field-with-select">
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
                  data-tour="customer-subscription-type"
                />
              </div>

              <div className="form-field-with-icon">
                <HiOutlineCreditCard className="form-field-icon" />
                <NumberInput
                  id="subscriptionPrice"
                  label="Precio de suscripción (€)"
                  value={formData.subscriptionPrice}
                  onChange={(value) => handleChange('subscriptionPrice', value)}
                  onBlur={() => handleBlur('subscriptionPrice')}
                  error={errors.subscriptionPrice}
                  min={0.01}
                  step={0.01}
                  required
                  disabled={isSubmitting}
                  placeholder="0.00"
                  data-tour="customer-subscription-price"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">Tipo y Consumo</h2>
            <p className="step-description">Clasificación del socio y previsión de consumo</p>
            
            <div className="step-form">
              <SegmentedToggle
                id="customerType"
                label="Tipo de consumidor"
                value={formData.customerType}
                onChange={(value) => handleChange('customerType', value as 'LUDICO' | 'TERAPEUTICO')}
                options={[
                  { value: 'LUDICO', label: 'Lúdico' },
                  { value: 'TERAPEUTICO', label: 'Terapéutico' },
                ]}
                disabled={isSubmitting}
              />

              <div className="form-field-with-icon">
                <HiChartBar className="form-field-icon" />
                <NumberInput
                  id="estimatedMonthlyConsumptionGrams"
                  label="Consumo estimado (g/mes)"
                  value={formData.estimatedMonthlyConsumptionGrams}
                  onChange={(value) => handleChange('estimatedMonthlyConsumptionGrams', value)}
                  onBlur={() => handleBlur('estimatedMonthlyConsumptionGrams')}
                  error={errors.estimatedMonthlyConsumptionGrams}
                  disabled={isSubmitting}
                  min={1}
                  step={1}
                  placeholder="100"
                  data-tour="customer-consumption-input"
                />
              </div>

              <div className="guarantor-picker-block">
                <div className="guarantor-picker-header">
                  <HiUsers className="form-field-icon" />
                  <span>Selecciona al socio aval</span>
                </div>
                <CustomerPicker
                  selectedCustomer={selectedGuarantor}
                  onSelect={(customer) => setSelectedGuarantor(customer)}
                />
                {errors.guarantor && (
                  <p className="form-error guarantor-error">{errors.guarantor}</p>
                )}
                {selectedGuarantor && !guarantorIsActive && (
                  <p className="form-error guarantor-error">
                    El socio aval debe tener la suscripción activa.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader title="Nuevo socio" onBack={handleBackButton} />
      <div className="customer-create-container">
        <div className="stepper-nav">
          <div className="stepper">
            {STEPS.map((step, index) => {
              const isCompleted = isStepComplete(step.id);
              const isCurrent = currentStep === step.id;
              const canNavigate = step.id <= currentStep || getCompletedSteps().includes(step.id - 1 as Step);

              return (
                <div key={step.id} className="stepper-item">
                  <button
                    type="button"
                    className={`stepper-button ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!canNavigate ? 'disabled' : ''}`}
                    onClick={() => canNavigate && handleGoToStep(step.id)}
                    disabled={!canNavigate}
                  >
                    <span className="stepper-number">
                      {isCompleted ? <HiCheck /> : index + 1}
                    </span>
                    <span className="stepper-label">{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`stepper-connector ${isCompleted ? 'completed' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="step-summary-bar">
            {STEPS.slice(0, currentStep).map(step => (
              <div key={step.id} className="step-summary-item">
                <span className="step-summary-label">{step.title}:</span>
                <span className="step-summary-value">{getStepSummary(step.id)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="step-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
            data-tour="cancel-customer"
          >
            Cancelar
          </Button>
          
          <div className="step-actions-center">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={isSubmitting}
                icon={<HiChevronLeft />}
              >
                Atrás
              </Button>
            )}
            
            {currentStep < 2 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={isSubmitting}
                icon={<HiChevronRight />}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (!contractSignatureDataUrl) {
                    setPendingSubmitAction('detail');
                    setIsContractModalOpen(true);
                    return;
                  }
                  handleSubmit();
                }}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Firmar y guardar
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              if (!contractSignatureDataUrl) {
                setPendingSubmitAction('detail');
                setIsContractModalOpen(true);
                return;
              }
              handleSubmit();
            }}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Guardar
          </Button>
        </div>

        <div className="step-container">
          {renderStepContent()}
        </div>
      </div>

      <ConfirmUnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
        isSaving={isSubmitting}
      />
      <ContractSignatureModal
        isOpen={isContractModalOpen}
        onClose={handleContractModalClose}
        onSigned={handleContractSigned}
        isSaving={isSubmitting}
      />
      <CameraModal
        isOpen={isProfileCameraOpen}
        onClose={() => setIsProfileCameraOpen(false)}
        onCapture={handleProfileCameraCapture}
        title="Foto de perfil"
      />
      <CameraModal
        isOpen={isDniCameraOpen}
        onClose={() => setIsDniCameraOpen(false)}
        onCapture={handleDniCameraCapture}
        title="Foto del DNI"
      />
    </>
  );
}
