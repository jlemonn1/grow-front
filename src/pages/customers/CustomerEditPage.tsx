import { useState, FormEvent, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineUser, HiOutlinePhone, HiOutlineDocumentText, HiLocationMarker, HiChartBar, HiUsers, HiCamera, HiCheck, HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { NumberInput } from '@/components/forms/NumberInput';
import { SegmentedToggle } from '@/components/forms/SegmentedToggle';
import { ConfirmUnsavedChangesModal } from '@/components/common/ConfirmUnsavedChangesModal';
import { ContractSignatureModal } from '@/components/customer/ContractSignatureModal';
import { CameraModal } from '@/components/customer/CameraModal';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { ValidationError } from '@/types/api';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import type { Customer, UpdateCustomerRequest } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './CustomerCreatePage.css';

interface FormData {
  displayName: string;
  phone: string;
  notes: string;
  address: string;
  estimatedMonthlyConsumptionGrams: number;
  customerType: 'LUDICO' | 'TERAPEUTICO';
}

interface FormErrors {
  displayName?: string;
  phone?: string;
  notes?: string;
  address?: string;
  estimatedMonthlyConsumptionGrams?: string;
  guarantor?: string;
}

type Step = 0 | 1 | 2;

const STEPS = [
  { id: 0 as Step, title: 'Básico', fields: ['displayName', 'phone', 'address'] as (keyof FormData)[] },
  { id: 1 as Step, title: 'Tipo y Consumo', fields: ['customerType', 'estimatedMonthlyConsumptionGrams'] as (keyof FormData)[] },
  { id: 2 as Step, title: 'Contrato', fields: [] as (keyof FormData)[] },
];

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const initialFormData: FormData = {
    displayName: '',
    phone: '',
    notes: '',
    address: '',
    estimatedMonthlyConsumptionGrams: 100,
    customerType: 'LUDICO',
  };

  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [originalFormData, setOriginalFormData] = useState<FormData>(initialFormData);
  const formDataRef = useRef<FormData>(formData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [dniPicture, setDniPicture] = useState<File | null>(null);
  const [dniNumber, setDniNumber] = useState<string>('');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [dniPicturePreview, setDniPicturePreview] = useState<string | null>(null);
  const [selectedGuarantor, setSelectedGuarantor] = useState<Customer | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [, setContractSignatureDataUrl] = useState<string | null>(null);
  const [isProfileCameraOpen, setIsProfileCameraOpen] = useState(false);
  const [isDniCameraOpen, setIsDniCameraOpen] = useState(false);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const loadCustomer = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const customerData = await customersService.getById(id);
      if (!customerData) {
        showToast('Socio no encontrado', 'error');
        navigate('/customers');
        return;
      }

      setCustomer(customerData);

      const customerFormData: FormData = {
        displayName: customerData.displayName || '',
        phone: customerData.phone || '',
        notes: customerData.notes || '',
        address: customerData.address || '',
        estimatedMonthlyConsumptionGrams: customerData.estimatedMonthlyConsumptionGrams ?? 100,
        customerType: customerData.customerType || 'LUDICO',
      };

      setFormData(customerFormData);
      setOriginalFormData(customerFormData);
      setDniNumber(customerData.dniNumber || '');

      const profilePictureUrl = customerData.profilePictureUrl
        ? (customerData.profilePictureUrl.startsWith('http')
          ? customerData.profilePictureUrl
          : `${baseApiUrl}${customerData.profilePictureUrl}`)
        : null;
      const dniPictureUrl = customerData.dniPictureUrl
        ? (customerData.dniPictureUrl.startsWith('http')
          ? customerData.dniPictureUrl
          : `${baseApiUrl}${customerData.dniPictureUrl}`)
        : null;

      setProfilePicturePreview(profilePictureUrl);
      setDniPicturePreview(dniPictureUrl);

      const contractSignatureUrl = customerData.contractSignatureUrl
        ? (customerData.contractSignatureUrl.startsWith('http')
          ? customerData.contractSignatureUrl
          : `${baseApiUrl}${customerData.contractSignatureUrl}`)
        : null;
      setContractSignatureDataUrl(contractSignatureUrl);

      if (customerData.guarantorId) {
        setSelectedGuarantor({
          id: customerData.guarantorId,
          displayName: customerData.guarantorDisplayName || 'Socio aval',
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
          guarantorStatus: customerData.guarantorStatus,
          contractSignedAt: undefined,
          contractSignatureUrl: undefined,
          customerType: 'LUDICO',
        });
      } else {
        setSelectedGuarantor(null);
      }
    } catch (err) {
      showToast('Error al cargar socio', 'error');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast, baseApiUrl]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const guarantorIsActive = useMemo(() => {
    if (!selectedGuarantor) return true;
    if (!selectedGuarantor.subscriptionEndDate) return true;
    return new Date(selectedGuarantor.subscriptionEndDate) >= new Date();
  }, [selectedGuarantor]);

  const validateField = (name: keyof FormData, value: string | number): string | undefined => {
    if (name === 'displayName') {
      const strValue = value as string;
      if (!strValue.trim()) {
        return 'El nombre es obligatorio';
      }
    }
    if (name === 'address') {
      const strValue = value as string;
      if (!strValue.trim()) {
        return 'La dirección es obligatoria';
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

    if (step === 1 && !selectedGuarantor) {
      stepErrors.guarantor = 'Selecciona un socio aval';
    } else if (step === 1 && selectedGuarantor && !guarantorIsActive) {
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
  }, []);

  const handleBlur = useCallback((name: keyof FormData) => {
    const value = formDataRef.current[name];
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, []);

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

  const hasUnsavedChanges = useMemo(() => {
    if (!customer) return false;

    const guarantorIdChanged = selectedGuarantor?.id !== customer.guarantorId;

    return (
      formData.displayName !== originalFormData.displayName ||
      formData.phone !== originalFormData.phone ||
      formData.notes !== originalFormData.notes ||
      formData.address !== originalFormData.address ||
      formData.estimatedMonthlyConsumptionGrams !== originalFormData.estimatedMonthlyConsumptionGrams ||
      formData.customerType !== originalFormData.customerType ||
      profilePicture !== null ||
      dniPicture !== null ||
      dniNumber !== (customer.dniNumber || '') ||
      guarantorIdChanged
    );
  }, [formData, customer, profilePicture, dniPicture, dniNumber, selectedGuarantor, originalFormData]);

  const handleSave = async (): Promise<boolean> => {
    if (!id || !customer) return false;

    for (const step of STEPS) {
      if (step.id < 2) {
        const errors = stepErrors[step.id];
        if (errors && Object.keys(errors).length > 0) {
          setCurrentStep(step.id);
          showToast('Completa todos los campos requeridos', 'error');
          return false;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateCustomerRequest = {
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        address: formData.address.trim() || undefined,
        estimatedMonthlyConsumptionGrams: Number(formData.estimatedMonthlyConsumptionGrams),
        customerType: formData.customerType,
        guarantorId: selectedGuarantor?.id,
      };

      await customersService.update(id, updateData);

      setOriginalFormData(formData);
      showToast('Socio actualizado exitosamente', 'success');
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: FormErrors = {};

          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            if (
              field === 'displayName' ||
              field === 'phone' ||
              field === 'notes' ||
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
          return false;
        }
      }

      showToast('Error al actualizar socio. Intente nuevamente.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const success = await handleSave();
    if (success) {
      navigate(`/customers/${id}`);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(`/customers/${id}`);
    }
  };

  const handleBackButton = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(`/customers/${id}`);
    }
  };

  const handleSaveAndExit = async () => {
    const success = await handleSave();
    setShowUnsavedChangesModal(false);
    if (success) {
      navigate(`/customers/${id}`);
    }
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    navigate(`/customers/${id}`);
  };

  const handleContractSigned = useCallback(async (signatureDataUrl: string) => {
    if (!customer) return;
    try {
      const updated = await customersService.update(customer.id, {
        contractSignatureDataUrl: signatureDataUrl,
      });
      setCustomer(updated);
      setContractSignatureDataUrl(signatureDataUrl);
      showToast('Contrato actualizado correctamente', 'success');
      setIsContractModalOpen(false);
    } catch (err) {
      showToast('Error al actualizar contrato', 'error');
    }
  }, [customer, showToast]);

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

  const getStepSummary = (step: Step): string => {
    switch (step) {
      case 0:
        return formData.displayName ? `• ${formData.displayName}` : 'Sin nombre';
      case 1:
        return formData.customerType === 'LUDICO' ? '• Lúdico' : '• Terapéutico';
      case 2:
        return customer?.contractSignatureUrl ? '• Firmado' : '• Sin firmar';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Cargando socio..." />
        <div className="customer-create-container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary-20)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <PageHeader title="Socio no encontrado" />
        <div className="customer-create-container">
          <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            <p>El socio que buscas no existe</p>
            <Button onClick={() => navigate('/customers')}>Volver a socios</Button>
          </div>
        </div>
      </>
    );
  }

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
                    {profilePicturePreview ? 'Cambiar foto' : 'Tomar foto'}
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
                      disabled={isSubmitting}
                      placeholder="Ej: 612 345 678"
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
                      required
                      disabled={isSubmitting}
                      placeholder="Ej: Calle Mayor 123"
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
                />
              </div>
            </div>
          </div>
        );

      case 1:
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

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">Contrato</h2>
            <p className="step-description">Información del contrato y firma</p>
            
            <div className="step-form">
              <div className="contract-section">
                <div className="contract-info">
                  <p><strong>PIN:</strong> {customer.pin}</p>
                  <p><strong>Tipo suscripción:</strong> {customer.subscriptionType === 'MONTHLY' ? 'Mensual' : 'Anual'}</p>
                  <p><strong>Precio suscripción:</strong> ${customer.subscriptionPrice.toFixed(2)}</p>
                  <p><strong>Estado suscripción:</strong> {new Date(customer.subscriptionEndDate) >= new Date() ? 'Activa' : 'Expirada'}</p>
                  {customer.contractSignedAt && (
                    <p><strong>Firma registrada el:</strong> {formatDateTime(customer.contractSignedAt)}</p>
                  )}
                </div>
                {customer.contractSignatureUrl && (
                  <div className="current-signature">
                    <label className="form-label">Firma actual:</label>
                    <img
                      src={customer.contractSignatureUrl.startsWith('http') ? customer.contractSignatureUrl : `${baseApiUrl}${customer.contractSignatureUrl}`}
                      alt="Firma actual"
                      className="current-contract-signature"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsContractModalOpen(true)}
                  icon={<HiOutlineDocumentText />}
                >
                  {customer.contractSignatureUrl ? 'Actualizar firma' : 'Firmar contrato'}
                </Button>
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
      <PageHeader 
        title="Editar socio" 
        subtitle={customer.displayName}
        onBack={handleBackButton}
      />
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
                onClick={() => handleSubmit()}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Guardar cambios
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={async () => {
              const success = await handleSave();
              if (!success) {
                showToast('Completa los campos requeridos', 'error');
              }
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
        onClose={() => setIsContractModalOpen(false)}
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
