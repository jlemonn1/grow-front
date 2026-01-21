import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineCurrencyEuro } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StockMovementCard } from '@/components/common/StockMovementCard';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { NumberInput } from '@/components/forms/NumberInput';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { RechargeStockModal } from '@/components/product/RechargeStockModal';
import { ImageUpload } from '@/components/product/ImageUpload';
import { ProductImage } from '@/components/common/ProductImage';
import { ConfirmUnsavedChangesModal } from '@/components/common/ConfirmUnsavedChangesModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { useUI } from '@/context/ui.context';
import { useProducts } from '@/context/products.context';
import { getStockMovements } from '@/services/stock.service';
import { listCategories } from '@/services/categories.service';
import { deleteProduct } from '@/services/products.service';
import type { Product, StockMovement, Category, UpdateProductRequest } from '@/types/models';
import type { ValidationError, PageResponse } from '@/types/api';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './ProductDetailPage.css';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { getProductById, updateProduct } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedMovements, setExpandedMovements] = useState<Set<string>>(new Set());
  
  const [editData, setEditData] = useState<UpdateProductRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Cargar producto y categorías
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [productData, categoriesData] = await Promise.all([
          getProductById(id),
          listCategories(),
        ]);

        if (!productData) {
          showToast('Producto no encontrado', 'error');
          navigate('/products');
          return;
        }

        setProduct(productData);
        setCategories(categoriesData);
        setEditData({
          name: productData.name,
          categoryId: productData.category.id,
          pricePerGram: productData.pricePerGram,
          description: productData.description || '',
          imageUrl: productData.imageUrl,
        });
      } catch (err) {
        showToast('Error al cargar producto', 'error');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, getProductById, navigate, showToast]);

  // Sincronizar editData cuando el producto cambia (solo si no estamos editando)
  useEffect(() => {
    if (product && !isEditing) {
      setEditData({
        name: product.name,
        categoryId: product.category.id,
        pricePerGram: product.pricePerGram,
        description: product.description || '',
        imageUrl: product.imageUrl,
      });
    }
  }, [product, isEditing]);

  // Asegurar que editData tiene los valores correctos cuando entramos en modo edición
  useEffect(() => {
    if (isEditing && product) {
      setEditData({
        name: product.name,
        categoryId: product.category.id,
        pricePerGram: product.pricePerGram,
        description: product.description || '',
        imageUrl: product.imageUrl,
      });
    }
  }, [isEditing, product]);

  // Cargar movimientos
  useEffect(() => {
    const loadMovements = async () => {
      if (!id) return;

      setLoadingMovements(true);
      try {
        const response: PageResponse<StockMovement> = await getStockMovements(id, {
          page: 0,
          size: 50,
        });
        setMovements(response.content);
      } catch (err) {
        showToast('Error al cargar historial de movimientos', 'error');
      } finally {
        setLoadingMovements(false);
      }
    };

    if (product) {
      loadMovements();
    }
  }, [id, product, showToast]);

  const handleEdit = () => {
    if (!product) return;
    // Asegurar que editData tiene los valores actuales del producto
    setEditData({
      name: product.name,
      categoryId: product.category.id,
      pricePerGram: product.pricePerGram,
      description: product.description || '',
      imageUrl: product.imageUrl,
    });
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    if (!product) return;
    setIsEditing(false);
    setEditData({
      name: product.name,
      categoryId: product.category.id,
      pricePerGram: product.pricePerGram,
      description: product.description || '',
      imageUrl: product.imageUrl,
    });
    setErrors({});
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !product) return;

    // Validación básica
    const newErrors: Record<string, string> = {};
    if (editData.name && !editData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (editData.pricePerGram !== undefined && editData.pricePerGram <= 0) {
      newErrors.pricePerGram = 'El precio debe ser mayor a 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para actualizar (solo campos modificados)
      const updateData: UpdateProductRequest = {};
      if (editData.name !== product.name) updateData.name = editData.name;
      if (editData.categoryId !== product.category.id) updateData.categoryId = editData.categoryId;
      if (editData.pricePerGram !== product.pricePerGram) updateData.pricePerGram = editData.pricePerGram;
      if (editData.description !== (product.description || '')) {
        updateData.description = editData.description;
      }
      if (editData.imageUrl !== undefined && editData.imageUrl !== product.imageUrl) {
        updateData.imageUrl = editData.imageUrl;
      }

      const updatedProduct = await updateProduct(id, updateData);
      setProduct(updatedProduct);
      // Actualizar editData con los valores del producto actualizado
      setEditData({
        name: updatedProduct.name,
        categoryId: updatedProduct.category.id,
        pricePerGram: updatedProduct.pricePerGram,
        description: updatedProduct.description || '',
        imageUrl: updatedProduct.imageUrl,
      });
      setIsEditing(false);
      showToast('Producto actualizado exitosamente', 'success');
    } catch (err) {
      // Manejo de errores de validación (422)
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            fieldErrors[field] = messages[0] || 'Error de validación';
          });
          setErrors(fieldErrors);
          showToast('Por favor, corrige los errores en el formulario', 'error');
          return;
        }
      }

      showToast('Error al actualizar producto', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRechargeSuccess = async () => {
    // Refrescar producto y movimientos
    if (!id) return;
    const updatedProduct = await getProductById(id);
    if (updatedProduct) {
      setProduct(updatedProduct);
    }

    // Recargar movimientos
    try {
      const response: PageResponse<StockMovement> = await getStockMovements(id, {
        page: 0,
        size: 50,
      });
      setMovements(response.content);
    } catch (err) {
      // Error silencioso, ya se mostró en el modal
    }
  };

  const handleToggleMovementExpand = (movementId: string) => {
    setExpandedMovements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(movementId)) {
        newSet.delete(movementId);
      } else {
        newSet.add(movementId);
      }
      return newSet;
    });
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  // Detectar si hay cambios sin guardar (solo cuando está en modo edición)
  const hasUnsavedChanges = useMemo(() => {
    if (!isEditing || !product) return false;
    return (
      (editData.name !== undefined && editData.name !== product.name) ||
      (editData.categoryId !== undefined && editData.categoryId !== product.category.id) ||
      (editData.pricePerGram !== undefined && editData.pricePerGram !== product.pricePerGram) ||
      (editData.description !== undefined && editData.description !== (product.description || '')) ||
      (editData.imageUrl !== undefined && editData.imageUrl !== product.imageUrl)
    );
  }, [isEditing, editData, product]);

  const handleBack = () => {
    if (isEditing && hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate('/products');
    }
  };

  const handleSaveAndExit = async () => {
    if (!id || !product) return;

    // Validación básica
    const newErrors: Record<string, string> = {};
    if (editData.name && !editData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (editData.pricePerGram !== undefined && editData.pricePerGram <= 0) {
      newErrors.pricePerGram = 'El precio debe ser mayor a 0';
    }
    if (!editData.imageUrl || !editData.imageUrl.trim()) {
      newErrors.imageUrl = 'La imagen es obligatoria';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowUnsavedChangesModal(false);
      return;
    }

    setIsSubmitting(true);
    setShowUnsavedChangesModal(false);

    try {
      const updateData: UpdateProductRequest = {};
      if (editData.name !== undefined && editData.name !== product.name) updateData.name = editData.name;
      if (editData.categoryId !== undefined && editData.categoryId !== product.category.id) updateData.categoryId = editData.categoryId;
      if (editData.pricePerGram !== undefined && editData.pricePerGram !== product.pricePerGram) updateData.pricePerGram = editData.pricePerGram;
      if (editData.description !== undefined && editData.description !== (product.description || '')) {
        updateData.description = editData.description;
      }
      if (editData.imageUrl !== undefined && editData.imageUrl !== product.imageUrl) {
        updateData.imageUrl = editData.imageUrl;
      }

      const updatedProduct = await updateProduct(id, updateData);
      // Actualizar editData con los valores del producto actualizado
      setEditData({
        name: updatedProduct.name,
        categoryId: updatedProduct.category.id,
        pricePerGram: updatedProduct.pricePerGram,
        description: updatedProduct.description || '',
        imageUrl: updatedProduct.imageUrl,
      });
      setProduct(updatedProduct);
      showToast('Producto actualizado exitosamente', 'success');
      navigate('/products');
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ValidationError;
        if (apiError.status === 422 && apiError.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            fieldErrors[field] = messages[0] || 'Error de validación';
          });
          setErrors(fieldErrors);
          showToast('Por favor, corrige los errores en el formulario', 'error');
        } else {
          showToast('Error al actualizar producto', 'error');
        }
      } else {
        showToast('Error al actualizar producto', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedChangesModal(false);
    handleCancelEdit();
    navigate('/products');
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!id || !product) return;

    setIsDeleting(true);
    try {
      await deleteProduct(id);
      showToast('Producto eliminado exitosamente', 'success');
      navigate('/products');
    } catch (err) {
      showToast('Error al eliminar producto', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Cargando producto..." onBack={handleBack} />
        <div className="product-detail-container">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PageHeader title="Producto no encontrado" onBack={handleBack} />
        <div className="product-detail-container">
          <EmptyState
            message="El producto que buscas no existe"
            action={{
              label: 'Volver a productos',
              onClick: () => navigate('/products'),
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={product.name}
        onBack={handleBack}
        action={
          !isEditing
            ? {
                label: 'Editar',
                onClick: handleEdit,
              }
            : undefined
        }
      />

      <div className="product-detail-container">
        {/* Sección de información/edición */}
        <div className="product-detail-section">
          {isEditing ? (
            <FormCard>
              <form onSubmit={handleSave} className="product-edit-form">
                <FormSection
                  title="Información básica"
                  description="Datos principales del producto"
                >
                  <div className="form-row">
                    <Input
                      id="edit-name"
                      label="Nombre del producto"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      error={errors.name}
                      required
                      disabled={isSubmitting}
                    />

                    <Select
                      id="edit-category"
                      label="Categoría"
                      value={editData.categoryId || ''}
                      onChange={(e) => setEditData({ ...editData, categoryId: e.target.value })}
                      options={[
                        { value: '', label: 'Seleccione una categoría' },
                        ...categoryOptions,
                      ]}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </FormSection>

                <FormSection
                  title="Precio"
                  description="Información de venta"
                >
                  <div className="form-row">
                    <div className="form-field-with-icon">
                      <HiOutlineCurrencyEuro className="form-field-icon" />
                      <NumberInput
                        key={`price-${product?.id}-${isEditing}`}
                        id="edit-price"
                        label="Precio por gramo (€)"
                        value={editData.pricePerGram !== undefined ? editData.pricePerGram : (product?.pricePerGram ?? 0)}
                        onChange={(value) => setEditData({ ...editData, pricePerGram: value })}
                        error={errors.pricePerGram}
                        min={0}
                        step={0.01}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Imagen del producto"
                  description="Sube una imagen para identificar el producto"
                >
                  <ImageUpload
                    value={editData.imageUrl || ''}
                    onChange={(url) => setEditData({ ...editData, imageUrl: url })}
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
                    id="edit-description"
                    label="Descripción"
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    disabled={isSubmitting}
                    rows={4}
                  />
                </FormSection>

                <div className="product-edit-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" loading={isSubmitting}>
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </FormCard>
          ) : (
            <FormCard>
              <div className="product-info">
                <FormSection
                  title="Información del producto"
                  description="Detalles principales del producto"
                >
                  <div className="product-detail-image-container">
                    <ProductImage 
                      imageUrl={product.imageUrl} 
                      alt={product.name}
                      size="large"
                    />
                  </div>
                  <div className="product-info-grid">
                    <div className="product-info-item">
                      <span className="product-info-label">Nombre:</span>
                      <span className="product-info-value">{product.name}</span>
                    </div>
                    <div className="product-info-item">
                      <span className="product-info-label">Categoría:</span>
                      <span className="product-info-value">{product.category.name}</span>
                    </div>
                    <div className="product-info-item">
                      <span className="product-info-label">Precio por gramo:</span>
                      <span className="product-info-value">{formatMoney(product.pricePerGram)}</span>
                    </div>
                    <div className="product-info-item">
                      <span className="product-info-label">Stock actual:</span>
                      <span className="product-info-value">{product.stockGrams.toFixed(2)}g</span>
                    </div>
                    {product.description && (
                      <div className="product-info-item product-info-item-full">
                        <span className="product-info-label">Descripción:</span>
                        <span className="product-info-value">{product.description}</span>
                      </div>
                    )}
                    {product.createdAt && (
                      <div className="product-info-item">
                        <span className="product-info-label">Fecha creación:</span>
                        <span className="product-info-value">{formatDateTime(product.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </FormSection>

                <div className="product-actions">
                  <Button variant="primary" onClick={() => setShowRechargeModal(true)}>
                    Recargar Stock
                  </Button>
                  <Button variant="secondary" onClick={handleEdit}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </FormCard>
          )}
        </div>

        {/* Sección de historial de movimientos */}
        <FormCard>
          <FormSection
            title="Historial de Movimientos"
            description="Registro de todos los movimientos de stock"
          >
            {loadingMovements ? (
              <div className="product-movements-loading">
                <Spinner size="md" />
              </div>
            ) : movements.length === 0 ? (
              <EmptyState message="No hay movimientos registrados" />
            ) : (
              <div className="product-movements-list">
                {movements.map((movement) => (
                  <StockMovementCard
                    key={movement.id}
                    movement={movement}
                    isExpanded={expandedMovements.has(movement.id)}
                    onToggleExpand={() => handleToggleMovementExpand(movement.id)}
                  />
                ))}
              </div>
            )}
          </FormSection>
        </FormCard>
      </div>

      {showRechargeModal && product && (
        <RechargeStockModal
          productId={product.id}
          productName={product.name}
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          onSuccess={handleRechargeSuccess}
        />
      )}
      {isEditing && (
        <ConfirmUnsavedChangesModal
          isOpen={showUnsavedChangesModal}
          onClose={() => setShowUnsavedChangesModal(false)}
          onSaveAndExit={handleSaveAndExit}
          onExitWithoutSaving={handleExitWithoutSaving}
          isSaving={isSubmitting}
        />
      )}
      {showDeleteModal && product && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Eliminar producto"
          message="¿Estás seguro de que deseas eliminar el producto"
          itemName={product.name}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
