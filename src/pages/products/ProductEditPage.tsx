import { useState, FormEvent, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineCurrencyEuro, HiCheck, HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { NumberInput } from '@/components/forms/NumberInput';
import { SegmentedToggle } from '@/components/forms/SegmentedToggle';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { ConfirmUnsavedChangesModal } from '@/components/common/ConfirmUnsavedChangesModal';
import { ImageUpload } from '@/components/product/ImageUpload';
import { useUI } from '@/context/ui.context';
import { useProducts } from '@/context/products.context';
import { listCategories } from '@/services/categories.service';
import type { Category, ProductMeasurementType, UpdateProductRequest } from '@/types/models';
import type { ValidationError, ApiError } from '@/types/api';
import { getMeasurementLongLabel } from '@/utils/measurement';
import './ProductCreatePage.css';

interface FormData {
  name: string;
  categoryId: string;
  pricePerGram: number;
  description: string;
  imageUrl: string;
  measurementType: ProductMeasurementType;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  pricePerGram?: string;
  description?: string;
  imageUrl?: string;
}

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { id: 0 as Step, title: 'Básico', fields: ['name', 'categoryId'] as (keyof FormData)[] },
  { id: 1 as Step, title: 'Precio', fields: ['measurementType', 'pricePerGram'] as (keyof FormData)[] },
  { id: 2 as Step, title: 'Imagen', fields: ['imageUrl'] as (keyof FormData)[] },
  { id: 3 as Step, title: 'Descripción', fields: ['description'] as (keyof FormData)[] },
];

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { getProductById, updateProduct } = useProducts();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  const [currentStep, setCurrentStep] = useState<Step>(0);
  
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);
  
  const initialFormData: FormData = {
    name: '',
    categoryId: '',
    pricePerGram: 0,
    description: '',
    imageUrl: '',
    measurementType: 'WEIGHT',
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [originalFormData, setOriginalFormData] = useState<FormData>(initialFormData);
  const formDataRef = useRef<FormData>(formData);
  const measurementLongName = getMeasurementLongLabel(formData.measurementType);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const loadCategories = useCallback(async (setLoading = true) => {
    if (setLoading) {
      setLoadingCategories(true);
    }
    try {
      const cats = await listCategories();
      setCategories(cats);
    } catch (err) {
      showToastRef.current('Error al cargar categorías', 'error');
    } finally {
      if (setLoading) {
        setLoadingCategories(false);
      }
    }
  }, []);

  const loadProduct = useCallback(async () => {
    if (!id) return;
    
    setLoadingProduct(true);
    try {
      const product = await getProductById(id);
      if (!product) {
        showToast('Producto no encontrado', 'error');
        navigate('/products');
        return;
      }

      const productData: FormData = {
        name: product.name,
        categoryId: product.category.id,
        pricePerGram: product.pricePerGram,
        description: product.description || '',
        imageUrl: product.imageUrl,
        measurementType: product.measurementType,
      };

      setFormData(productData);
      setOriginalFormData(productData);
    } catch (err) {
      showToast('Error al cargar producto', 'error');
      navigate('/products');
    } finally {
      setLoadingProduct(false);
    }
  }, [id, getProductById, navigate, showToast]);

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, [loadCategories, loadProduct]);

  const validateField = (name: keyof FormData, value: string | number): string | undefined => {
    if (name === 'name') {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return 'El nombre es obligatorio';
      }
    }
    if (name === 'categoryId') {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return 'La categoría es obligatoria';
      }
    }
    if (name === 'pricePerGram') {
      if (typeof value === 'number' && value <= 0) {
        return 'El precio debe ser mayor a 0';
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

    return stepErrors;
  };

  const stepErrors = useMemo(() => {
    return STEPS.reduce((acc, step) => {
      acc[step.id] = validateStep(step.id);
      return acc;
    }, {} as Record<Step, FormErrors>);
  }, [formData]);

  const isStepComplete = (step: Step): boolean => {
    return Object.keys(stepErrors[step] || {}).length === 0;
  };

  const getCompletedSteps = (): Step[] => {
    return STEPS.filter(s => s.id < currentStep && isStepComplete(s.id)).map(s => s.id) as Step[];
  };

  const handleChange = useCallback((name: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    setErrors((prev) => {
      if (name in prev) {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleBlur = useCallback((name: keyof FormData) => {
    const value = formDataRef.current[name];
    if (typeof value !== 'boolean' && value !== undefined) {
      const error = validateField(name, value);
      if (error) {
        setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
      }
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

    if (currentStep < 3) {
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
    return (
      formData.name !== originalFormData.name ||
      formData.categoryId !== originalFormData.categoryId ||
      formData.pricePerGram !== originalFormData.pricePerGram ||
      formData.description !== originalFormData.description ||
      formData.imageUrl !== originalFormData.imageUrl ||
      formData.measurementType !== originalFormData.measurementType
    );
  }, [formData, originalFormData]);

  const handleSave = async (): Promise<boolean> => {
    for (const step of STEPS) {
      if (step.id < 3) {
        const errors = stepErrors[step.id];
        if (errors && Object.keys(errors).length > 0) {
          setCurrentStep(step.id);
          showToast('Completa todos los campos requeridos', 'error');
          return false;
        }
      }
    }

    if (!id) return false;

    setIsSubmitting(true);

    try {
      const updateData: UpdateProductRequest = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        pricePerGram: formData.pricePerGram,
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        measurementType: formData.measurementType,
      };

      await updateProduct(id, updateData);
      
      setOriginalFormData(formData);
      showToast('Producto actualizado exitosamente', 'success');
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: FormErrors = {};
          
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            if (field === 'name' || field === 'categoryId' || field === 'pricePerGram' || 
                field === 'description' || field === 'imageUrl') {
              fieldErrors[field as keyof FormErrors] = messages[0] || 'Error de validación';
            }
          });

          setErrors(fieldErrors);
          
          if (Object.keys(fieldErrors).length > 0) {
            showToast('Por favor, corrige los errores en el formulario', 'error');
          }
          return false;
        }
      }

      showToast('Error al actualizar producto. Intente nuevamente.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const success = await handleSave();
    if (success) {
      navigate(`/products/${id}`);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(`/products/${id}`);
    }
  };

  const handleBackButton = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(`/products/${id}`);
    }
  };

  const handleOpenCreateCategoryModal = useCallback(() => {
    setShowCreateCategoryModal(true);
    setNewCategoryName('');
    setCategoryError(null);
  }, []);

  const handleCloseCreateCategoryModal = useCallback(() => {
    if (!isCreatingCategory) {
      setShowCreateCategoryModal(false);
      setNewCategoryName('');
      setCategoryError(null);
    }
  }, [isCreatingCategory]);

  const handleCategoryNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCategoryName(value);
    if (categoryError) {
      setCategoryError(null);
    }
  }, [categoryError]);

  const handleCreateCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setCategoryError('El nombre de la categoría es obligatorio');
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError(null);

    try {
      const { createCategory: createCategoryService } = await import('@/services/categories.service');
      const newCategory = await createCategoryService({ name: newCategoryName.trim() });
      
      await loadCategories(false);
      
      setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
      
      if (errors.categoryId) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.categoryId;
          return newErrors;
        });
      }
      
      showToast(`Categoría "${newCategory.name}" creada exitosamente`, 'success');
      setShowCreateCategoryModal(false);
      setNewCategoryName('');
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as ApiError;
        if (apiError.status === 422) {
          const validationError = apiError as ValidationError;
          if (validationError.fieldErrors) {
            const firstError = Object.values(validationError.fieldErrors)[0]?.[0];
            setCategoryError(firstError || 'Error de validación');
            return;
          }
        }
        if (apiError.status === 409) {
          setCategoryError('Ya existe una categoría con ese nombre');
          return;
        }
      }

      const errorMessage = err instanceof Error ? err.message : 'Error al crear categoría';
      setCategoryError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
  }, [categories]);

  const getStepSummary = (step: Step): string => {
    switch (step) {
      case 0:
        return formData.name ? `• ${formData.name}` : 'Sin nombre';
      case 1:
        return formData.pricePerGram > 0 
          ? `• ${formData.pricePerGram}€`
          : 'Sin precio';
      case 2:
        return formData.imageUrl ? '• Imagen asignada' : '• Sin imagen (opcional)';
      case 3:
        return formData.description ? '• Con descripción' : 'Sin descripción';
      default:
        return '';
    }
  };

  const handleSaveAndExit = async () => {
    const success = await handleSave();
    setShowUnsavedChangesModal(false);
    if (success) {
      navigate(`/products/${id}`);
    }
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    navigate(`/products/${id}`);
  };

  if (loadingCategories || loadingProduct) {
    return (
      <>
        <PageHeader title="Editar producto" onBack={handleBackButton} />
        <div className="product-create-container">
          <Spinner size="lg" />
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
            <p className="step-description">Datos principales del producto</p>
            
            <div className="step-form">
              <Input
                id="name"
                label="Nombre del producto"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                error={errors.name}
                required
                disabled={isSubmitting}
                placeholder="Ej: Amnesia Haze"
                data-tour="product-name-input"
                autoFocus
              />

              <div className="category-select-wrapper">
                <Select
                  id="categoryId"
                  label="Categoría"
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  onBlur={() => handleBlur('categoryId')}
                  error={errors.categoryId}
                  options={[
                    { value: '', label: 'Seleccione una categoría' },
                    ...categoryOptions,
                  ]}
                  required
                  disabled={isSubmitting}
                  data-tour="product-category-select"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleOpenCreateCategoryModal}
                  disabled={isSubmitting}
                  className="create-category-button"
                  data-tour="create-category-button"
                >
                  + Nueva
                </Button>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">Precio</h2>
            <p className="step-description">Define el tipo de medición y el precio</p>
            
            <div className="step-form">
              <SegmentedToggle
                id="measurementType"
                label="Tipo de medición"
                value={formData.measurementType}
                onChange={(value) => handleChange('measurementType', value as ProductMeasurementType)}
                options={[
                  { value: 'WEIGHT', label: 'Peso' },
                  { value: 'UNIT', label: 'Unidad' },
                ]}
                disabled={isSubmitting}
              />
              
              <div className="form-field-with-icon">
                <HiOutlineCurrencyEuro className="form-field-icon" />
                <NumberInput
                  id="pricePerGram"
                  label={`Precio por ${measurementLongName} (€)`}
                  value={formData.pricePerGram}
                  onChange={(value) => handleChange('pricePerGram', value)}
                  onBlur={() => handleBlur('pricePerGram')}
                  error={errors.pricePerGram}
                  min={0}
                  step={0.01}
                  required
                  disabled={isSubmitting}
                  placeholder="0.00"
                  data-tour="product-price-input"
                  autoFocus
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">Imagen del producto</h2>
            <p className="step-description">Sube una imagen para identificar el producto (opcional)</p>
            
            <div className="step-form">
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => handleChange('imageUrl', url)}
                data-tour="product-image-upload"
              />
              <p className="step-hint">Puedes continuar sin imagen y añadirla más tarde</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2 className="step-title">Descripción</h2>
            <p className="step-description">Información adicional sobre el producto (opcional)</p>
            
            <div className="step-form">
              <Textarea
                id="description"
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                error={errors.description}
                disabled={isSubmitting}
                placeholder="Información adicional sobre el producto..."
                rows={4}
                data-tour="product-description-textarea"
                autoFocus
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader title="Editar producto" onBack={handleBackButton} />
      <div className="product-create-container">
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
            data-tour="cancel-product"
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
            
            {currentStep < 3 ? (
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
                data-tour="save-product"
              >
                Guardar producto
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

      <Modal
        isOpen={showCreateCategoryModal}
        onClose={handleCloseCreateCategoryModal}
        title="Nueva categoría"
      >
        <form onSubmit={handleCreateCategory} className="create-category-form">
          <Input
            id="newCategoryName"
            label="Nombre de la categoría"
            type="text"
            value={newCategoryName}
            onChange={handleCategoryNameChange}
            error={categoryError || undefined}
            required
            disabled={isCreatingCategory}
            placeholder="Ej: Flores"
            autoFocus
          />

          <div className="create-category-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseCreateCategoryModal}
              disabled={isCreatingCategory}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isCreatingCategory}
              disabled={isCreatingCategory}
            >
              Crear categoría
            </Button>
          </div>
        </form>
      </Modal>
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
