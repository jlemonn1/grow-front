import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCube, HiOutlineShoppingCart, HiOutlinePlus, HiOutlineRefresh, HiOutlineClock, HiCheck, HiChevronRight, HiChevronLeft } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import { ProductPicker } from '@/components/sale/ProductPicker';
import { RecommendedProductsGallery } from '@/components/sale/RecommendedProductsGallery';
import { TicketItemsList } from '@/components/sale/TicketItemsList';
import { TicketSummary } from '@/components/sale/TicketSummary';
import { WizardSummary } from '@/components/sale/WizardSummary';
import { NumericKeypad } from '@/components/common/NumericKeypad';
import { SaleCreateMain } from '@/components/sale/SaleCreateMain';

import { SaleSuccessModal } from '@/components/sale/SaleSuccessModal';
import { DraftRecoveryModal } from '@/components/sale/DraftRecoveryModal';

import { ProductDispenseInput } from '@/components/sale/ProductDispenseInput';
import { Button } from '@/components/common/Button';
import { useTicket } from '@/hooks/useTicket';
import { useTicket as useTicketContext } from '@/context/ticket.context';
import { useProducts } from '@/context/products.context';
import { useUI } from '@/context/ui.context';
import { getMeasurementShortLabel } from '@/utils/measurement';
import { createSale, getSaleDraft, deleteSaleDraft, clearSaleDraft, savePendingSale } from '@/services/sales.service';
import { customersService } from '@/services/customers.service';
import { login } from '@/services/auth.service';
import { PendingSalesModal } from '@/components/sale/PendingSalesModal';
import { CajaClosedModal } from '@/components/cajafuerte/CajaClosedModal';
import { useCajaStatus } from '@/hooks/useCajaStatus';
import type { ValidationError, ApiError } from '@/types/api';
import type { CreateSaleRequest, Product, Sale, SaleDraft, PendingSale } from '@/types/models';
import './SaleCreatePage.css';
import '@/components/sale/SaleCreateMain.css';

type Step = 0 | 1 | 2;

const STEPS = [
  { id: 0 as Step, title: 'Socio', icon: HiOutlineUser },
  { id: 1 as Step, title: 'Productos', icon: HiOutlineCube },
  { id: 2 as Step, title: 'Pago', icon: HiOutlineShoppingCart },
];

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
    subtotalBeforeDiscount,
    discountAmount,
    cashGiven,
    change,
    isValid,
    isSavingDraft,
    useBalance,
    balanceToUse,
    saveChangeToBalance,
    balanceUsed,
    balanceRemaining,
    appliedCoupon,
    manualDiscountPercent,
    manualDiscountType,
    setUseBalance,
    setBalanceToUse,
    setSaveChangeToBalance,
    applyCoupon,
    removeCoupon,
    setManualDiscount,
  } = ticketContext;
  const {
    setCustomer,
    setCashGiven,
    removeItem,
    reset,
    getProductStock,
    addProductToTicket,
    updateItemGrams,
    validateItemWithStock,
    refreshProductAndValidate,
    findProductIdByName,
    ensureProductInContext,
  } = ticket;

  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const selectedMeasurementSuffix = getMeasurementShortLabel(selectedProduct?.measurementType ?? 'WEIGHT');
  const [gramsToAdd, setGramsToAdd] = useState<number>(0);
  const [eurosToAdd, setEurosToAdd] = useState<number>(0);
  const [actualWeighedGrams, setActualWeighedGrams] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashGivenError, setCashGivenError] = useState<string | undefined>();
  const [successSale, setSuccessSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [draft, setDraft] = useState<SaleDraft | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [shouldValidateAfterLoad, setShouldValidateAfterLoad] = useState(false);

  const [showPendingSalesModal, setShowPendingSalesModal] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  
  // Estado local para el keypad de efectivo (string para preservar decimales mientras se escribe)
  const [cashGivenInput, setCashGivenInput] = useState('');
  const lastSyncedCashGivenRef = useRef(0);
  
  // Sincronizar el estado local del keypad cuando cashGiven cambia desde fuera (ej: borrador, reset)
  useEffect(() => {
    // Solo actualizar si el valor cambió desde fuera para no interferir con la escritura
    if (cashGiven !== lastSyncedCashGivenRef.current) {
      lastSyncedCashGivenRef.current = cashGiven;
      const cashGivenStr = cashGiven === 0 ? '' : cashGiven.toString();
      setCashGivenInput(cashGivenStr);
    }
  }, [cashGiven]);
   
  // Hook para verificar estado de caja
  const { isTodayClosed } = useCajaStatus();
  
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
            useBalance: false, // No disponible en el draft
            balanceToUse: undefined, // No disponible en el draft
            saveChangeToBalance: false // No disponible en el draft
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
  const handleProductSelect = useCallback(async (product: Product | null, autoAdd = false) => {
    setSelectedProduct(product);
    if (product) {
      try {
        await ensureProductInContext(product);
        const stock = getProductStock(product.id);
        const grams = Math.min(1, stock);
        setGramsToAdd(grams);

        if (autoAdd && grams > 0) {
          await addProductToTicket(product, grams);
          showToast('Producto agregado al ticket', 'success');
          if (currentStep === 0) {
            setCompletedSteps(prev => new Set([...prev, 0]));
            setCurrentStep(1);
          }
        }
      } catch (error) {
        console.error('Error al cargar producto:', error);
        showToast('Error al cargar el producto', 'error');
        setSelectedProduct(null);
      }
    } else {
      setGramsToAdd(0);
    }
  }, [ensureProductInContext, getProductStock, showToast, addProductToTicket, currentStep, setCompletedSteps, setCurrentStep]);

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
        showToast(`Stock insuficiente. Disponible: ${stock.toFixed(2)}${selectedMeasurementSuffix}`, 'error');
        return;
      }

      await addProductToTicket(product, gramsToAdd, actualWeighedGrams > 0 ? actualWeighedGrams : undefined, eurosToAdd > 0 ? eurosToAdd : undefined);
      setSelectedProduct(null);
      setGramsToAdd(0);
      setEurosToAdd(0);
      setActualWeighedGrams(0);
      showToast('Producto agregado al ticket', 'success');
    } catch (error) {
      showToast('Error al obtener el producto', 'error');
    }
  }, [selectedProduct, gramsToAdd, eurosToAdd, actualWeighedGrams, ensureProductInContext, getProductStock, addProductToTicket, showToast]);

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
      // Validar que se ha ingresado el efectivo recibido (solo si no se usa saldo o el saldo no cubre todo)
      const effectiveCashNeeded = useBalance ? Math.max(0, total - balanceToUse) : total;
      if (effectiveCashNeeded > 0 && cashGiven <= 0) {
        showToast('Debes ingresar el efectivo recibido', 'warning');
        setIsProcessing(false);
        setGlobalLoading(false);
        return;
      }

      // Construir request
      // Redondear valores a 2 decimales para evitar problemas de precisión de punto flotante
      const roundedCashGiven = Math.round(cashGiven * 100) / 100;
      const roundedBalanceToUse = useBalance ? Math.round(balanceToUse * 100) / 100 : undefined;
      
      const request: CreateSaleRequest = {
        customerId: customer.id,
        cashGiven: roundedCashGiven,
        useBalance,
        balanceToUse: roundedBalanceToUse,
        saveChangeToBalance,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
          actualWeighedGrams: item.actualWeighedGrams,
          // Enviar el subtotal exacto si el usuario introdujo euros directamente
          // De lo contrario, el backend calculará desde gramos
          lineTotal: item.eurosInput,
        })),
        couponCode: appliedCoupon?.code,
        manualDiscountPercent: manualDiscountPercent ?? undefined,
        manualDiscountType: manualDiscountPercent != null ? manualDiscountType : undefined,
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
        showToast(apiError.message || 'Error al procesar la dispensación', 'error');
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

    // Verificar si la caja está cerrada
    if (isTodayClosed) {
      setShowClosedModal(true);
      return;
    }

    // Procesar directamente
    await processSaleInternal();
  }, [
    isValid,
    customer,
    items,
    isTodayClosed,
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
    // Limpiar estado local del keypad
    setCashGivenInput('');
    // Limpiar refs de inputs
    if (gramsInputRef.current) {
      gramsInputRef.current.value = '';
    }
    // Limpiar wizard
    setCurrentStep(0);
    setCompletedSteps(new Set());
    // Mostrar confirmación
    showToast('Todos los campos han sido limpiados', 'success');
  }, [reset, setCashGiven, showToast, cashGivenInput]);

  const canGoToStep = (step: Step): boolean => {
    if (step === 0) return true;
    if (step === 1) return customer !== null;
    if (step === 2) return customer !== null && items.length > 0;
    return false;
  };

  const validateStep = (step: Step): boolean => {
    if (step === 0) return customer !== null;
    if (step === 1) return customer !== null && items.length > 0;
    if (step === 2) return customer !== null && items.length > 0 && isValid;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 2 && canGoToStep((currentStep + 1) as Step)) {
      if (validateStep(currentStep)) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setCurrentStep(prev => (prev + 1) as Step);
      } else {
        showToast('Completa los datos requeridos para continuar', 'warning');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => (prev - 1) as Step);
    } else {
      navigate('/home');
    }
  };

  const handleGoToStep = (step: Step) => {
    if (step <= currentStep || canGoToStep(step)) {
      setCurrentStep(step);
    }
  };

  const renderProgressBar = () => {
    return (
      <div className="wizard-top-bar">
        <div className="wizard-progress-bar">
          <div className="wizard-progress-track">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isActive = currentStep === step.id;
              const isClickable = step.id <= currentStep || canGoToStep(step.id);

              return (
                <div key={step.id} className="wizard-progress-step">
                  <button
                    className={`wizard-step-button ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isClickable ? 'disabled' : ''}`}
                    onClick={() => isClickable && handleGoToStep(step.id)}
                    disabled={!isClickable}
                  >
                    <div className="wizard-step-indicator">
                      {isCompleted ? <HiCheck /> : index + 1}
                    </div>
                    <span className="wizard-step-label">{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`wizard-step-connector ${isCompleted ? 'completed' : ''}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="wizard-navigation">
          <Button
            variant="secondary"
            onClick={handleBack}
            icon={<HiChevronLeft />}
            disabled={isProcessing}
          >
            {currentStep === 0 ? 'Cancelar' : 'Anterior'}
          </Button>
          {currentStep < 2 && (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canGoToStep((currentStep + 1) as Step) || isProcessing}
              icon={<HiChevronRight />}
            >
              Siguiente
            </Button>
          )}
        </div>
        <div className="wizard-actions">
          <Button
            variant="secondary"
            onClick={() => setShowPendingSalesModal(true)}
            icon={<HiOutlineClock />}
          >
            Pedidos Pendientes
          </Button>
          <Button
            variant="secondary"
            onClick={handleReset}
            icon={<HiOutlineRefresh />}
            className="wizard-btn-clean"
          >
            Limpiar todo
          </Button>
        </div>
      </div>
    );
  };

  const renderStep0 = () => (
    <div className="wizard-step-content wizard-step-0">
      <div className="sale-create-section wizard-section-full">
        <div className="sale-create-section-header">
          <HiOutlineUser className="sale-create-section-icon" />
          <h2 className="sale-create-section-title">Selecciona un Socio</h2>
        </div>
        <CustomerPicker
          ref={customerSearchRef}
          selectedCustomer={customer}
          onSelect={setCustomer}
        />
      </div>

      {customer && (
        <div className="sale-create-section wizard-section-full">
          <div className="sale-create-section-header">
            <HiOutlineCube className="sale-create-section-icon" />
            <h2 className="sale-create-section-title">Opciones Rápidas para {customer.displayName}</h2>
          </div>
          <RecommendedProductsGallery
            customerId={customer.id}
            onProductSelect={handleProductSelect}
          />
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="wizard-step-content wizard-step-1">
      <SaleCreateMain>
        <div className="sale-create-section">
          <div className="sale-create-section-header">
            <HiOutlineCube className="sale-create-section-icon" />
            <h2 className="sale-create-section-title">Buscar Productos</h2>
          </div>
          <ProductPicker
            ref={productSearchRef}
            selectedProduct={selectedProduct}
            onSelect={handleProductSelect}
            customerId={customer?.id}
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
                    onEurosChange={setEurosToAdd}
                    onActualWeighedGramsChange={setActualWeighedGrams}
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
            <h2 className="sale-create-section-title">Ticket ({items.length} productos)</h2>
          </div>
          <TicketItemsList
            items={items}
            onUpdate={updateItemGrams}
            onRemove={removeItem}
            onValidate={validateItemWithStock}
            getProductStock={getProductStock}
          />
        </div>
      </SaleCreateMain>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step-content wizard-step-2">
      <div className="wizard-step-2-grid">
        <div className="wizard-step-2-col1">
          <TicketSummary
            customerName={customer?.displayName || null}
            customerBalance={customer?.balance}
            items={items}
            total={total}
            subtotalBeforeDiscount={subtotalBeforeDiscount}
            discountAmount={discountAmount}
            cashGiven={cashGiven}
            change={change}
            isValid={isValid}
            isProcessing={isProcessing}
            useBalance={useBalance}
            balanceToUse={balanceToUse}
            saveChangeToBalance={saveChangeToBalance}
            balanceUsed={balanceUsed}
            balanceRemaining={balanceRemaining}
            appliedCoupon={appliedCoupon}
            manualDiscountPercent={manualDiscountPercent}
            manualDiscountType={manualDiscountType}
            onCashGivenChange={setCashGiven}
            onUseBalanceChange={setUseBalance}
            onBalanceToUseChange={setBalanceToUse}
            onSaveChangeToBalanceChange={setSaveChangeToBalance}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            onSetManualDiscount={setManualDiscount}
            onProcessSale={handleProcessSale}
            cashGivenError={cashGivenError}
          />
        </div>

        <div className="wizard-step-2-col2">
          <WizardSummary
            customer={customer}
            items={items}
            total={total}
            discountAmount={discountAmount}
            cashGiven={cashGiven}
            change={change}
            useBalance={useBalance}
            balanceToUse={balanceToUse}
          />

          {items.length > 0 && (!useBalance || balanceUsed < total) && (
            <div className="wizard-keypad">
              <h3 className="wizard-keypad-title">Efectivo recibido</h3>
              <NumericKeypad
                value={cashGivenInput}
                onChange={(value) => {
                  setCashGivenInput(value);
                  const numValue = parseFloat(value) || 0;
                  lastSyncedCashGivenRef.current = numValue;
                  setCashGiven(numValue);
                }}
                onSubmit={() => {}}
                disabled={isProcessing}
                showSubmit={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader 
        title="Dispensar" 
        onBack={handleBack}
        isSaving={isSavingDraft}
        dataTourBack="back-to-home"
      />

      {renderProgressBar()}

      <div className="sale-create-container">
        {renderCurrentStep()}
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

      <PendingSalesModal
        isOpen={showPendingSalesModal}
        onClose={() => setShowPendingSalesModal(false)}
        onRecover={handleRecoverPendingSale}
      />

      <CajaClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
      />
    </>
  );
}
