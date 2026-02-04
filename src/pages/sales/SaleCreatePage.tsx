import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCube, HiOutlineShoppingCart, HiOutlinePlus, HiOutlineRefresh, HiOutlineClock } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import { ProductPicker } from '@/components/sale/ProductPicker';
import { RecommendedProductsGallery } from '@/components/sale/RecommendedProductsGallery';
import { TicketItemsList } from '@/components/sale/TicketItemsList';
import { TicketSummary } from '@/components/sale/TicketSummary';
import { CashDenominationsSelector } from '@/components/sale/CashDenominationsSelector';
import { SaleSuccessModal } from '@/components/sale/SaleSuccessModal';
import { DraftRecoveryModal } from '@/components/sale/DraftRecoveryModal';
import { PartialChangeModal } from '@/components/sale/PartialChangeModal';
import { ProductDispenseInput } from '@/components/sale/ProductDispenseInput';
import { Button } from '@/components/common/Button';
import { useTicket } from '@/hooks/useTicket';
import { useTicket as useTicketContext } from '@/context/ticket.context';
import { useProducts } from '@/context/products.context';
import { useUI } from '@/context/ui.context';
import { createSale, getSaleDraft, deleteSaleDraft, clearSaleDraft, savePendingSale } from '@/services/sales.service';
import { customersService } from '@/services/customers.service';
import { login } from '@/services/auth.service';
import { PendingSalesModal } from '@/components/sale/PendingSalesModal';
import type { ValidationError, ApiError } from '@/types/api';
import type { CreateSaleRequest, Product, Sale, SaleDraft, DenominationsMap, PendingSale } from '@/types/models';
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
    isSavingDraft,
    useBalance,
    balanceToUse,
    saveChangeToBalance,
    balanceUsed,
    balanceRemaining,
    setUseBalance,
    setBalanceToUse,
    setSaveChangeToBalance,
  } = ticketContext;
  const {
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
  const [cashGivenDenominations, setCashGivenDenominations] = useState<DenominationsMap>({});
  const [changeDenominations, setChangeDenominations] = useState<DenominationsMap | null>(null);
  const [showPartialChangeModal, setShowPartialChangeModal] = useState(false);
  const [partialChangeData, setPartialChangeData] = useState<{
    changeAmount: number;
    changeDenominations: DenominationsMap;
    remainingAmount: number;
  } | null>(null);
  const [showPendingSalesModal, setShowPendingSalesModal] = useState(false);
  
  // Refs para atajos de teclado
  const gramsInputRef = useRef<HTMLInputElement>(null);
  const eurosInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<{ focus: () => void }>(null);
  const customerSearchRef = useRef<{ focus: () => void }>(null);

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

  // Log cuando el componente se monta
  useEffect(() => {
    console.log('[SaleCreatePage] Componente montado');
    console.log('[SaleCreatePage] URL actual:', window.location.pathname);
    
    // Verificar que los elementos clave existen después de un breve delay
    setTimeout(() => {
      const pageHeader = document.querySelector('[data-tour="page-header-title"]');
      const customerInput = document.querySelector('[data-tour="customer-search-input"]');
      const productInput = document.querySelector('[data-tour="product-search-input"]');
      const saleContainer = document.querySelector('.sale-create-container');
      
      console.log('[SaleCreatePage] Verificación de elementos después de montar:');
      console.log('[SaleCreatePage]   - page-header-title:', !!pageHeader);
      console.log('[SaleCreatePage]   - customer-search-input:', !!customerInput);
      console.log('[SaleCreatePage]   - product-search-input:', !!productInput);
      console.log('[SaleCreatePage]   - sale-create-container:', !!saleContainer);
      
      // Listar todos los elementos con data-tour
      const allTourElements = document.querySelectorAll('[data-tour]');
      console.log('[SaleCreatePage] Elementos con data-tour encontrados:', Array.from(allTourElements).map(el => ({
        selector: el.getAttribute('data-tour'),
        tag: el.tagName,
        className: el.className
      })));
    }, 1000);
  }, []);

  // Cargar borrador al montar
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await getSaleDraft();
        if (savedDraft) {
          // Solo mostrar el modal si el borrador tiene contenido (cliente o items)
          const hasContent = savedDraft.customerId !== null || (savedDraft.items && savedDraft.items.length > 0);
          if (hasContent) {
            setDraft(savedDraft);
            setShowDraftModal(true);
          }
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
      // Si el borrador tiene contenido (cliente o items), guardarlo como pendiente antes de eliminarlo
      if (draft && (draft.customerId || (draft.items && draft.items.length > 0))) {
        try {
          // Guardar como pendiente usando la información del draft directamente
          // El draft no tiene selectedProduct, gramsToAdd ni denominaciones, así que usamos valores por defecto
          await savePendingSale({
            customerId: draft.customerId || null,
            cashGiven: draft.cashGiven || 0,
            items: draft.items || [],
            selectedProductId: null, // No disponible en el draft
            gramsToAdd: null, // No disponible en el draft
            cashGivenDenominations: undefined, // No disponible en el draft
            changeDenominations: undefined, // No disponible en el draft
            useBalance: false, // No disponible en el draft
            balanceToUse: undefined, // No disponible en el draft
            saveChangeToBalance: false, // No disponible en el draft
          });
          showToast('Borrador guardado como pendiente', 'success');
        } catch (error) {
          console.error('Error al guardar borrador como pendiente:', error);
          // Continuar con la eliminación aunque falle el guardado como pendiente
        }
      }
      
      // Eliminar el borrador
      await deleteSaleDraft();
      setShowDraftModal(false);
      setDraft(null);
    } catch (error) {
      console.error('Error al eliminar borrador:', error);
      showToast('Error al eliminar borrador', 'error');
    }
  }, [draft, showToast]);

  // Manejar recuperación de pedido pendiente
  const handleRecoverPendingSale = useCallback(async (pendingSale: PendingSale) => {
    try {
      ticketContext.setIsLoadingDraft(true);
      setGlobalLoading(true);
      
      // Cargar cliente PRIMERO si existe
      if (pendingSale.customerId) {
        try {
          const customerData = await customersService.getById(pendingSale.customerId);
          ticketContext.setCustomer(customerData);
        } catch (error) {
          console.error('Error al cargar cliente del pendiente:', error);
          showToast('Error al cargar el cliente del pedido pendiente', 'error');
          return;
        }
      } else {
        ticketContext.setCustomer(null);
      }

      // Pre-cargar todos los productos del pendiente
      const productIds = pendingSale.items.map(item => item.productId);
      if (pendingSale.selectedProductId) {
        productIds.push(pendingSale.selectedProductId);
      }
      
      // Refrescar productos ANTES de cargar
      await Promise.all(productIds.map(id => refreshProduct(id)));
      
      // Esperar a que React procese la actualización
      await new Promise(resolve => setTimeout(resolve, 300));

      // Cargar el pendiente completo (incluye items, denominaciones, configuración de saldo)
      const additionalState = await ticketContext.loadPendingSale(pendingSale, getProductById);
      
      // Restaurar estado adicional del formulario
      if (additionalState.selectedProductId) {
        try {
          const product = await getProductById(additionalState.selectedProductId);
          if (product) {
            setSelectedProduct(product);
            setGramsToAdd(additionalState.gramsToAdd);
          }
        } catch (error) {
          console.error('Error al cargar producto seleccionado:', error);
        }
      }
      
      // Restaurar denominaciones
      setCashGivenDenominations(additionalState.cashGivenDenominations);
      setChangeDenominations(additionalState.changeDenominations);
      
      // Refrescar productos después de cargar
      await Promise.all(productIds.map(id => refreshProduct(id)));
      
      // Activar flag para validación
      setShouldValidateAfterLoad(true);
      
      showToast('Pedido pendiente recuperado exitosamente', 'success');
    } catch (error) {
      console.error('Error al recuperar pedido pendiente:', error);
      showToast('Error al recuperar pedido pendiente', 'error');
    } finally {
      ticketContext.setIsLoadingDraft(false);
      setGlobalLoading(false);
    }
  }, [ticketContext, getProductById, refreshProduct, showToast, setGlobalLoading]);

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

  // Procesar venta (función interna que realmente hace el procesamiento)
  const processSaleInternal = useCallback(async () => {
    if (!isValid) {
      showToast('El ticket no es válido. Revisa los errores.', 'warning');
      return;
    }

    if (!customer) {
      showToast('Debes seleccionar un socio', 'warning');
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
      // Validar que hay denominaciones recibidas (deben haberse contado automáticamente)
      const hasCashGivenDenominations = cashGivenDenominations && 
        Object.keys(cashGivenDenominations).length > 0 && 
        Object.values(cashGivenDenominations).some(qty => qty > 0);
      
      if (cashGiven > 0 && !hasCashGivenDenominations) {
        showToast('No se han registrado las denominaciones recibidas. Usa los botones de billetes/monedas.', 'warning');
        setIsProcessing(false);
        setGlobalLoading(false);
        return;
      }

      // Solo validar denominaciones de cambio si no se guarda todo en saldo
      if (change > 0 && !saveChangeToBalance && (!changeDenominations || Object.keys(changeDenominations).length === 0)) {
        showToast('Debes calcular las denominaciones de cambio', 'warning');
        setIsProcessing(false);
        setGlobalLoading(false);
        return;
      }

      // Construir request
      // Si se guarda todo el cambio en saldo, no enviar denominaciones de cambio
      const request: CreateSaleRequest = {
        customerId: customer.id,
        cashGiven,
        cashGivenDenominations,
        changeDenominations: change > 0 && !saveChangeToBalance ? (changeDenominations ?? undefined) : undefined,
        useBalance,
        balanceToUse: useBalance ? balanceToUse : undefined,
        saveChangeToBalance,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
          discount: item.discount,
          discountType: item.discountType,
        })),
      };

      // Crear venta
      const sale = await createSale(request);

      // Limpiar borrador después de completar venta exitosamente
      try {
        await clearSaleDraft();
      } catch (error) {
        console.error('Error al limpiar borrador después de venta:', error);
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
      setCashGivenDenominations({});
      setChangeDenominations(null);
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
    cashGivenDenominations,
    changeDenominations,
    change,
    useBalance,
    balanceToUse,
    saveChangeToBalance,
    reset,
    getProductStock,
    updateProductStock,
    refreshProductAndValidate,
    findProductIdByName,
    showToast,
    setGlobalLoading,
  ]);

  // Procesar venta (función pública que verifica cambio parcial)
  const handleProcessSale = useCallback(async () => {
    if (!isValid) {
      showToast('El ticket no es válido. Revisa los errores.', 'warning');
      return;
    }

    if (!customer) {
      showToast('Debes seleccionar un socio', 'warning');
      return;
    }

    if (items.length === 0) {
      showToast('Debes agregar al menos un producto', 'warning');
      return;
    }

    // Verificar si el cambio es parcial (solo si no se había marcado guardar en saldo)
    if (change > 0 && !saveChangeToBalance && changeDenominations) {
      const changeGiven = Object.entries(changeDenominations)
        .filter(([_, qty]) => qty > 0)
        .reduce((sum, [denomination, qty]) => sum + parseFloat(denomination) * qty, 0);
      
      const changeDifference = Math.abs(changeGiven - change);
      
      // Si hay diferencia significativa (más de 0.01), es cambio parcial
      if (changeDifference > 0.01 && changeGiven < change) {
        const remainingAmount = change - changeGiven;
        // Marcar automáticamente "guardar en saldo" para el resto del cambio
        setSaveChangeToBalance(true);
        setPartialChangeData({
          changeAmount: change,
          changeDenominations,
          remainingAmount,
        });
        setShowPartialChangeModal(true);
        return;
      }
    }

    // Si no hay cambio parcial, procesar directamente
    await processSaleInternal();
  }, [
    isValid,
    customer,
    items,
    change,
    saveChangeToBalance,
    changeDenominations,
    processSaleInternal,
    showToast,
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
    setCashGivenDenominations({});
    setChangeDenominations(null);
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
    // Mostrar confirmación
    showToast('Todos los campos han sido limpiados', 'success');
  }, [reset, setCashGiven, showToast]);

  return (
    <>
      <PageHeader 
        title="Dispensar" 
        onBack={handleBack}
        isSaving={isSavingDraft}
        action={{
          label: 'Limpiar todo',
          onClick: handleReset,
          icon: HiOutlineRefresh,
        }}
        dataTourBack="back-to-home"
      />
      <div style={{ padding: '0 24px', marginBottom: '16px' }}>
        <Button
          variant="secondary"
          onClick={() => setShowPendingSalesModal(true)}
          icon={<HiOutlineClock />}
        >
          Pedidos Pendientes
        </Button>
      </div>
      <div className="sale-create-container">
        <div className="sale-create-main">
          <div className="sale-create-section">
            <div className="sale-create-section-header">
              <HiOutlineUser className="sale-create-section-icon" />
              <h2 className="sale-create-section-title">Socio</h2>
            </div>
            <CustomerPicker
              ref={customerSearchRef}
              selectedCustomer={customer}
              onSelect={setCustomer}
            />
            {customer && (
              <RecommendedProductsGallery
                customerId={customer.id}
                onProductSelect={handleProductSelect}
              />
            )}
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
                  data-tour="add-product"
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
            customerBalance={customer?.balance}
            items={items}
            total={total}
            cashGiven={cashGiven}
            change={change}
            isValid={isValid}
            isProcessing={isProcessing}
            useBalance={useBalance}
            balanceToUse={balanceToUse}
            saveChangeToBalance={saveChangeToBalance}
            balanceUsed={balanceUsed}
            balanceRemaining={balanceRemaining}
            onCashGivenChange={setCashGiven}
            onUseBalanceChange={setUseBalance}
            onBalanceToUseChange={setBalanceToUse}
            onSaveChangeToBalanceChange={setSaveChangeToBalance}
            onProcessSale={handleProcessSale}
            cashGivenError={cashGivenError}
            cashGivenDenominations={cashGivenDenominations}
            changeDenominations={changeDenominations}
            onCashGivenDenominationsChange={setCashGivenDenominations}
          />

          {change > 0 && !saveChangeToBalance && (
            <div className="sale-create-denominations-section">
              <CashDenominationsSelector
                changeAmount={change}
                changeDenominations={changeDenominations}
                onChangeDenominationsChange={setChangeDenominations}
                disabled={isProcessing}
              />
            </div>
          )}
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

      {partialChangeData && (
        <PartialChangeModal
          isOpen={showPartialChangeModal}
          changeAmount={partialChangeData.changeAmount}
          changeDenominations={partialChangeData.changeDenominations}
          remainingAmount={partialChangeData.remainingAmount}
          onConfirm={async () => {
            setShowPartialChangeModal(false);
            setPartialChangeData(null);
            // Limpiar denominaciones de cambio ya que todo se guardará en saldo
            setChangeDenominations(null);
            // Continuar con el procesamiento de la venta
            await processSaleInternal();
          }}
          onCancel={() => {
            setShowPartialChangeModal(false);
            setPartialChangeData(null);
            setIsProcessing(false);
            setGlobalLoading(false);
          }}
        />
      )}

      <PendingSalesModal
        isOpen={showPendingSalesModal}
        onClose={() => setShowPendingSalesModal(false)}
        onRecover={handleRecoverPendingSale}
      />
    </>
  );
}
