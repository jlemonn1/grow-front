import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCube, HiOutlineShoppingCart, HiOutlinePlus, HiOutlineRefresh } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import { ProductPicker } from '@/components/sale/ProductPicker';
import { TicketItemsList } from '@/components/sale/TicketItemsList';
import { TicketSummary } from '@/components/sale/TicketSummary';
import { SaleSuccessModal } from '@/components/sale/SaleSuccessModal';
import { DraftRecoveryModal } from '@/components/sale/DraftRecoveryModal';
import { ProductDispenseInput } from '@/components/sale/ProductDispenseInput';
import { Button } from '@/components/common/Button';
import { useTicket } from '@/hooks/useTicket';
import { useTicket as useTicketContext } from '@/context/ticket.context';
import { useProducts } from '@/context/products.context';
import { useUI } from '@/context/ui.context';
import { createSale, getSaleDraft, deleteSaleDraft } from '@/services/sales.service';
import { customersService } from '@/services/customers.service';
import { login } from '@/services/auth.service';
import type { ValidationError, ApiError } from '@/types/api';
import type { CreateSaleRequest, Product, Sale, SaleDraft } from '@/types/models';
import './SaleCreatePage.css';

export function SaleCreatePage() {
  const navigate = useNavigate();
  const { showToast, setGlobalLoading } = useUI();
  const { products, updateProductStock, getProductById, refreshProduct } = useProducts();
  const ticket = useTicket();
  const ticketContext = useTicketContext();
  const {
    customer,
    items,
    total,
    cashGiven,
    change,
    isValid,
    setCustomer,
    setCashGiven,
    removeItem,
    reset,
    getProductStock,
    addProductToTicket,
    updateItemGrams,
    updateItemDiscount,
    validateItemWithStock,
    refreshProductAndValidate,
    findProductIdByName,
    ensureProductInContext,
  } = ticket;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [gramsToAdd, setGramsToAdd] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashGivenError, setCashGivenError] = useState<string | undefined>();
  const [successSale, setSuccessSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [draft, setDraft] = useState<SaleDraft | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [shouldValidateAfterLoad, setShouldValidateAfterLoad] = useState(false);
  
  // Refs para atajos de teclado
  const gramsInputRef = useRef<HTMLInputElement>(null);
  const eurosInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<{ focus: () => void }>(null);
  const customerSearchRef = useRef<{ focus: () => void }>(null);
  const cashGivenInputRef = useRef<HTMLInputElement>(null);

  // Validar items cuando se cargan productos después de recuperar borrador
  useEffect(() => {
    if (shouldValidateAfterLoad && items.length > 0 && products.length > 0) {
      // Verificar que todos los productos del borrador estén en el contexto
      const productIds = items.map(item => item.productId);
      const allProductsLoaded = productIds.every(id => 
        products.some(p => p.id === id)
      );
      
      if (allProductsLoaded) {
        // Esperar un frame más para asegurar que todo esté sincronizado
        requestAnimationFrame(() => {
          setTimeout(() => {
            ticket.validateAllItems();
            setShouldValidateAfterLoad(false);
          }, 100);
        });
      }
    }
  }, [shouldValidateAfterLoad, items, products, ticket]);

  // Cargar borrador al montar
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await getSaleDraft();
        if (savedDraft) {
          setDraft(savedDraft);
          setShowDraftModal(true);
        }
      } catch (error) {
        console.error('Error al cargar borrador:', error);
      }
    };
    
    loadDraft();
  }, []);

  // Manejar recuperación de borrador
  const handleRecoverDraft = useCallback(async () => {
    if (!draft) return;

    try {
      ticketContext.setIsLoadingDraft(true);
      
      // Cargar cliente PRIMERO si existe
      if (draft.customerId) {
        try {
          const customerData = await customersService.getById(draft.customerId);
          ticketContext.setCustomer(customerData);
        } catch (error) {
          console.error('Error al cargar cliente del borrador:', error);
        }
      } else {
        ticketContext.setCustomer(null);
      }

      // Pre-cargar todos los productos del borrador para asegurar que estén en el contexto
      const productIds = draft.items.map(item => item.productId);
      
      // Refrescar productos ANTES de cargar el borrador para tener stock actualizado
      await Promise.all(productIds.map(id => refreshProduct(id)));

      // Esperar a que React procese la actualización de productos
      await new Promise(resolve => setTimeout(resolve, 300));

      // Cargar items del borrador
      await ticketContext.loadDraft(draft, getProductById);
      
      // Refrescar productos después de cargar para asegurar stock actualizado
      await Promise.all(productIds.map(id => refreshProduct(id)));
      
      // Activar flag para que el useEffect valide cuando los productos estén listos
      setShouldValidateAfterLoad(true);

      // Eliminar borrador del backend
      await deleteSaleDraft();
      
      setShowDraftModal(false);
      setDraft(null);
      showToast('Borrador recuperado exitosamente', 'success');
    } catch (error) {
      console.error('Error al recuperar borrador:', error);
      showToast('Error al recuperar borrador', 'error');
    } finally {
      ticketContext.setIsLoadingDraft(false);
    }
  }, [draft, ticketContext, getProductById, ticket, showToast]);

  // Manejar descartar borrador
  const handleDiscardDraft = useCallback(async () => {
    try {
      await deleteSaleDraft();
      setShowDraftModal(false);
      setDraft(null);
    } catch (error) {
      console.error('Error al eliminar borrador:', error);
    }
  }, []);

  // Manejar selección de producto
  const handleProductSelect = useCallback(async (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      try {
        await ensureProductInContext(product);
        const stock = getProductStock(product.id);
        setGramsToAdd(Math.min(1, stock));
      } catch (error) {
        console.error('Error al cargar producto:', error);
        showToast('Error al cargar el producto', 'error');
        setSelectedProduct(null);
      }
    } else {
      setGramsToAdd(0);
    }
  }, [ensureProductInContext, getProductStock, showToast]);

  // Agregar producto al ticket
  const handleAddProduct = useCallback(async () => {
    if (!selectedProduct || gramsToAdd <= 0) {
      showToast('Selecciona un producto y especifica los gramos', 'warning');
      return;
    }

    try {
      const product = await ensureProductInContext(selectedProduct);
      const stock = getProductStock(product.id);
      
      if (gramsToAdd > stock) {
        showToast(`Stock insuficiente. Disponible: ${stock.toFixed(2)}g`, 'error');
        return;
      }

      await addProductToTicket(product, gramsToAdd);
      setSelectedProduct(null);
      setGramsToAdd(0);
      showToast('Producto agregado al ticket', 'success');
    } catch (error) {
      showToast('Error al obtener el producto', 'error');
    }
  }, [selectedProduct, gramsToAdd, ensureProductInContext, getProductStock, addProductToTicket, showToast]);

  // Procesar venta
  const handleProcessSale = useCallback(async () => {
    if (!isValid) {
      showToast('El ticket no es válido. Revisa los errores.', 'warning');
      return;
    }

    if (!customer) {
      showToast('Debes seleccionar un cliente', 'warning');
      return;
    }

    if (items.length === 0) {
      showToast('Debes agregar al menos un producto', 'warning');
      return;
    }

    setIsProcessing(true);
    setGlobalLoading(true);
    setCashGivenError(undefined);

    try {
      // Construir request
      const request: CreateSaleRequest = {
        customerId: customer.id,
        cashGiven,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
          discount: item.discount,
          discountType: item.discountType,
        })),
      };

      // Crear venta
      const sale = await createSale(request);

      // Eliminar borrador después de completar venta exitosamente
      try {
        await deleteSaleDraft();
      } catch (error) {
        console.error('Error al eliminar borrador después de venta:', error);
      }

      // Actualizar stock optimista para cada producto
      items.forEach(item => {
        const currentStock = getProductStock(item.productId);
        const newStock = currentStock - item.grams;
        updateProductStock(item.productId, newStock);
      });

      // Guardar venta para mostrar en modal
      setSuccessSale(sale);
      setShowSuccessModal(true);

      // Reset ticket
      reset();
      setSelectedProduct(null);
      setGramsToAdd(0);
    } catch (error) {
      // Manejo de errores específicos
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ApiError;

        // Error 401: Re-autenticar
        if (apiError.status === 401) {
          try {
            await login('admin', 'admin');
            showToast('Sesión renovada. Intenta nuevamente.', 'info');
            // Reintentar la venta
            await handleProcessSale();
            return;
          } catch (authError) {
            showToast('Error de autenticación. Por favor, recarga la página.', 'error');
            return;
          }
        }

        // Error 409: Stock insuficiente
        if (apiError.status === 409) {
          const productInfo = apiError.productInfo;
          
          if (productInfo?.productName) {
            // Buscar el productId por nombre
            const productId = findProductIdByName(productInfo.productName);
            
            if (productId) {
              // Refrescar producto desde API y validar el item correspondiente
              await refreshProductAndValidate(productId);
            }
          }

          showToast(
            productInfo?.productName 
              ? `Stock insuficiente para ${productInfo.productName}. Stock actualizado.`
              : 'Stock insuficiente. El stock ha sido actualizado.',
            'warning'
          );
          return;
        }

        // Error 422: Validación
        if (apiError.status === 422) {
          const validationError = apiError as ValidationError;
          
          if (validationError.fieldErrors) {
            // Mapear errores a campos
            const fieldErrors = validationError.fieldErrors;
            
            // Errores de cashGiven
            if (fieldErrors['cashGiven'] || fieldErrors['cash_given']) {
              const cashError = fieldErrors['cashGiven']?.[0] || fieldErrors['cash_given']?.[0];
              setCashGivenError(cashError || 'Efectivo inválido');
            }

            // Errores de items
            Object.keys(fieldErrors).forEach(key => {
              // Formato: items[0].grams
              const itemMatch = key.match(/items\[(\d+)\]\.grams/);
              if (itemMatch) {
                const itemIndex = parseInt(itemMatch[1], 10);
                const errorMsg = fieldErrors[key]?.[0];
                if (errorMsg && items[itemIndex]) {
                  // El error ya se mostrará en TicketItemRow
                  showToast(`Error en línea ${itemIndex + 1}: ${errorMsg}`, 'error');
                }
              }
            });

            // Mostrar mensaje general si hay errores
            const allErrors = Object.values(fieldErrors).flat();
            if (allErrors.length > 0) {
              showToast(allErrors[0] || 'Error de validación', 'error');
            }
          } else {
            showToast(apiError.message || 'Error de validación', 'error');
          }
          return;
        }

        // Otros errores
        showToast(apiError.message || 'Error al procesar la venta', 'error');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  }, [
    isValid,
    customer,
    items,
    cashGiven,
    total,
    reset,
    getProductStock,
    updateProductStock,
    refreshProductAndValidate,
    findProductIdByName,
    showToast,
    setGlobalLoading,
  ]);

  // Atajos de teclado (después de definir handleProcessSale)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: focus en búsqueda de producto
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        productSearchRef.current?.focus();
        return;
      }

      // Ctrl/Cmd + Shift + C: focus en búsqueda de cliente (usamos Shift+C para evitar conflicto con copiar)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        customerSearchRef.current?.focus();
        return;
      }

      // Ctrl/Cmd + Enter: procesar venta
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isValid && !isProcessing) {
          handleProcessSale();
        }
        return;
      }

      // Escape: limpiar selecciones
      if (e.key === 'Escape') {
        if (selectedProduct) {
          setSelectedProduct(null);
          setGramsToAdd(0);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValid, isProcessing, selectedProduct, handleProcessSale]);

  const handleBack = () => {
    navigate('/home');
  };

  const handleReset = useCallback(() => {
    // Resetear todo el ticket (esto ya limpia customer, items, cashGiven)
    reset();
    // Limpiar producto seleccionado y gramos
    setSelectedProduct(null);
    setGramsToAdd(0);
    // Limpiar errores
    setCashGivenError(undefined);
    // Asegurar que cashGiven está en 0 (aunque reset() ya lo hace)
    setCashGiven(0);
    // Limpiar refs de inputs
    if (gramsInputRef.current) {
      gramsInputRef.current.value = '';
    }
    if (cashGivenInputRef.current) {
      cashGivenInputRef.current.value = '';
    }
    // Mostrar confirmación
    showToast('Todos los campos han sido limpiados', 'success');
  }, [reset, setCashGiven, showToast]);

  return (
    <>
      <PageHeader 
        title="Caja" 
        onBack={handleBack}
        action={{
          label: 'Limpiar todo',
          onClick: handleReset,
          icon: HiOutlineRefresh,
        }}
      />
      <div className="sale-create-container">
        <div className="sale-create-main">
          <div className="sale-create-section">
            <div className="sale-create-section-header">
              <HiOutlineUser className="sale-create-section-icon" />
              <h2 className="sale-create-section-title">Cliente</h2>
            </div>
            <CustomerPicker
              ref={customerSearchRef}
              selectedCustomer={customer}
              onSelect={setCustomer}
            />
          </div>

          <div className="sale-create-section">
            <div className="sale-create-section-header">
              <HiOutlineCube className="sale-create-section-icon" />
              <h2 className="sale-create-section-title">Agregar Producto</h2>
            </div>
            <ProductPicker
              ref={productSearchRef}
              selectedProduct={selectedProduct}
              onSelect={handleProductSelect}
            />
            {selectedProduct && (
              <div className="sale-create-product-form">
                <div className="sale-create-dispense-input">
                  <div onKeyDown={(e) => {
                    if (e.key === 'Enter' && gramsToAdd > 0) {
                      e.preventDefault();
                      handleAddProduct();
                    }
                  }}>
                    <ProductDispenseInput
                      product={selectedProduct}
                      availableStock={getProductStock(selectedProduct.id)}
                      onGramsChange={setGramsToAdd}
                      gramsInputRef={gramsInputRef}
                      eurosInputRef={eurosInputRef}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddProduct}
                  disabled={gramsToAdd <= 0}
                  style={{ minWidth: '120px' }}
                >
                  <HiOutlinePlus style={{ marginRight: '8px' }} />
                  Agregar
                </Button>
              </div>
            )}
          </div>

          <div className="sale-create-section">
            <div className="sale-create-section-header">
              <HiOutlineShoppingCart className="sale-create-section-icon" />
              <h2 className="sale-create-section-title">Productos en el Ticket</h2>
            </div>
            <TicketItemsList
              items={items}
              onUpdate={updateItemGrams}
              onUpdateDiscount={updateItemDiscount}
              onRemove={removeItem}
              onValidate={validateItemWithStock}
              getProductStock={getProductStock}
            />
          </div>
        </div>

        <div className="sale-create-sidebar">
          <TicketSummary
            customerName={customer?.displayName || null}
            items={items}
            total={total}
            cashGiven={cashGiven}
            change={change}
            isValid={isValid}
            isProcessing={isProcessing}
            onCashGivenChange={setCashGiven}
            onProcessSale={handleProcessSale}
            cashGivenError={cashGivenError}
          />
        </div>
      </div>

      <SaleSuccessModal
        isOpen={showSuccessModal}
        sale={successSale}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessSale(null);
        }}
        onNewSale={() => {
          // El ticket ya está reseteado, solo necesitamos cerrar el modal
          setShowSuccessModal(false);
          setSuccessSale(null);
        }}
      />

      <DraftRecoveryModal
        isOpen={showDraftModal}
        draft={draft}
        onRecover={handleRecoverDraft}
        onDiscard={handleDiscardDraft}
      />
    </>
  );
}
