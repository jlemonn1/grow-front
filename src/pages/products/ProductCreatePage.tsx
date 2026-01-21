import { useState, FormEvent, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCurrencyEuro, HiOutlineArchive } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { NumberInput } from '@/components/forms/NumberInput';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { ConfirmUnsavedChangesModal } from '@/components/common/ConfirmUnsavedChangesModal';
import { ImageUpload } from '@/components/product/ImageUpload';
import { useUI } from '@/context/ui.context';
import { useProducts } from '@/context/products.context';
import { listCategories, createCategory } from '@/services/categories.service';
import type { Category } from '@/types/models';
import type { ValidationError, ApiError } from '@/types/api';
import './ProductCreatePage.css';

interface FormData {
  name: string;
  categoryId: string;
  pricePerGram: number;
  description: string;
  imageUrl: string;
  initialStockGrams: number;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  pricePerGram?: string;
  description?: string;
  imageUrl?: string;
  initialStockGrams?: string;
}

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { createProduct } = useProducts();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  // Ref para mantener el showToast sin causar re-renders
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
    initialStockGrams: 0,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const formDataRef = useRef<FormData>(formData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Sincronizar ref con formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Función para cargar categorías (memoizada para evitar re-renders)
  const loadCategories = useCallback(async (setLoading = true) => {
    if (setLoading) {
      setLoadingCategories(true);
    }
    try {
      const cats = await listCategories();
      setCategories(cats);
    } catch (err) {
      // Usar ref para evitar dependencias
      showToastRef.current('Error al cargar categorías', 'error');
    } finally {
      if (setLoading) {
        setLoadingCategories(false);
      }
    }
  }, []);

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    if (name === 'initialStockGrams') {
      if (typeof value === 'number' && value < 0) {
        return 'El stock inicial no puede ser negativo';
      }
    }
    if (name === 'imageUrl') {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return 'La imagen es obligatoria';
      }
    }
    return undefined;
  };

  const handleChange = useCallback((name: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    setErrors((prev) => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleBlur = useCallback((name: keyof FormData) => {
    const value = formDataRef.current[name];
    const error = validateField(name, value);
    if (error) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;
    
    const categoryError = validateField('categoryId', formData.categoryId);
    if (categoryError) newErrors.categoryId = categoryError;
    
    const priceError = validateField('pricePerGram', formData.pricePerGram);
    if (priceError) newErrors.pricePerGram = priceError;
    
    const stockError = validateField('initialStockGrams', formData.initialStockGrams);
    if (stockError) newErrors.initialStockGrams = stockError;
    
    const imageError = validateField('imageUrl', formData.imageUrl);
    if (imageError) newErrors.imageUrl = imageError;

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
      const product = await createProduct({
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        pricePerGram: formData.pricePerGram,
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl,
        initialStockGrams: formData.initialStockGrams,
      });

      showToast('Producto creado exitosamente', 'success');
      navigate(`/products/${product.id}`);
    } catch (error) {
      // Manejo de errores de validación (422)
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: FormErrors = {};
          
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            if (field === 'name' || field === 'categoryId' || field === 'pricePerGram' || 
                field === 'description' || field === 'imageUrl' || field === 'initialStockGrams') {
              fieldErrors[field as keyof FormErrors] = messages[0] || 'Error de validación';
            }
          });

          setErrors(fieldErrors);
          
          if (Object.keys(fieldErrors).length > 0) {
            showToast('Por favor, corrige los errores en el formulario', 'error');
          }
          return;
        }
      }

      // Otros errores
      showToast('Error al crear producto. Intente nuevamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/products');
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
      const newCategory = await createCategory({ name: newCategoryName.trim() });
      
      // Recargar categorías (sin mostrar loading)
      await loadCategories(false);
      
      // Seleccionar la nueva categoría
      setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
      
      // Limpiar error de categoría si existía
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
      // Manejo de errores de validación (422)
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

      // Otros errores
      const errorMessage = err instanceof Error ? err.message : 'Error al crear categoría';
      setCategoryError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Memoizar las opciones de categorías para evitar re-renders innecesarios
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
  }, [categories]);

  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = useMemo(() => {
    return (
      formData.name !== initialFormData.name ||
      formData.categoryId !== initialFormData.categoryId ||
      formData.pricePerGram !== initialFormData.pricePerGram ||
      formData.description !== initialFormData.description ||
      formData.imageUrl !== initialFormData.imageUrl ||
      formData.initialStockGrams !== initialFormData.initialStockGrams
    );
  }, [formData]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate('/products');
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
      const product = await createProduct({
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        pricePerGram: formData.pricePerGram,
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl,
        initialStockGrams: formData.initialStockGrams,
      });

      showToast('Producto creado exitosamente', 'success');
      navigate('/products');
    } catch (error) {
      // Manejo de errores de validación (422)
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: FormErrors = {};
          
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            if (field === 'name' || field === 'categoryId' || field === 'pricePerGram' || 
                field === 'description' || field === 'imageUrl' || field === 'initialStockGrams') {
              fieldErrors[field as keyof FormErrors] = messages[0] || 'Error de validación';
            }
          });

          setErrors(fieldErrors);
          
          if (Object.keys(fieldErrors).length > 0) {
            showToast('Por favor, corrige los errores en el formulario', 'error');
          }
        }
      } else {
        showToast('Error al crear producto. Intente nuevamente.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    navigate('/products');
  };

  if (loadingCategories) {
    return (
      <>
        <PageHeader title="Nuevo producto" onBack={handleBack} />
        <div className="product-create-container">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Nuevo producto" onBack={handleBack} />
      <div className="product-create-container">
        <FormCard>
          <form onSubmit={handleSubmit} className="product-create-form">
            <FormSection
              title="Información básica"
              description="Datos principales del producto"
            >
              <div className="form-row">
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
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleOpenCreateCategoryModal}
                    disabled={isSubmitting}
                    className="create-category-button"
                  >
                    + Nueva categoría
                  </Button>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Precio y stock"
              description="Información de venta e inventario"
            >
              <div className="form-row">
                <div className="form-field-with-icon">
                  <HiOutlineCurrencyEuro className="form-field-icon" />
                  <NumberInput
                    id="pricePerGram"
                    label="Precio por gramo (€)"
                    value={formData.pricePerGram}
                    onChange={(value) => handleChange('pricePerGram', value)}
                    onBlur={() => handleBlur('pricePerGram')}
                    error={errors.pricePerGram}
                    min={0}
                    step={0.01}
                    required
                    disabled={isSubmitting}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-field-with-icon">
                  <HiOutlineArchive className="form-field-icon" />
                  <NumberInput
                    id="initialStockGrams"
                    label="Stock inicial (gramos)"
                    value={formData.initialStockGrams}
                    onChange={(value) => handleChange('initialStockGrams', value)}
                    onBlur={() => handleBlur('initialStockGrams')}
                    error={errors.initialStockGrams}
                    min={0}
                    step={0.01}
                    required
                    disabled={isSubmitting}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Imagen del producto"
              description="Sube una imagen para identificar el producto"
            >
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => handleChange('imageUrl', url)}
                onError={(error) => {
                  setErrors((prev) => ({ ...prev, imageUrl: error }));
                }}
              />
              {errors.imageUrl && (
                <div className="form-error" style={{ marginTop: 'var(--spacing-xs)' }}>
                  {errors.imageUrl}
                </div>
              )}
            </FormSection>

            <FormSection
              title="Descripción"
              description="Información adicional sobre el producto (opcional)"
            >
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
              />
            </FormSection>

            <div className="product-create-actions">
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
                Guardar producto
              </Button>
            </div>
          </form>
        </FormCard>
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
