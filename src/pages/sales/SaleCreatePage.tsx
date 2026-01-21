import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCube, HiOutlineShoppingCart, HiOutlinePlus, HiOutlineRefresh } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { CustomerPicker } from '@/components/sale/CustomerPicker';
import { ProductPicker } from '@/components/sale/ProductPicker';
import { TicketItemsList } from '@/components/sale/TicketItemsList';
import { TicketSummary } from '@/components/sale/TicketSummary';
import { SaleSuccessModal } from '@/components/sale/SaleSuccessModal';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { useTicket } from '@/hooks/useTicket';
import { useProducts } from '@/context/products.context';
import { useUI } from '@/context/ui.context';
import { createSale } from '@/services/sales.service';
import { login } from '@/services/auth.service';
import type { ValidationError, ApiError } from '@/types/api';
import type { CreateSaleRequest, Product, Sale } from '@/types/models';
import './SaleCreatePage.css';

export function SaleCreatePage() {
  const navigate = useNavigate();
  const { showToast, setGlobalLoading } = useUI();
  const { products, updateProductStock, getProductById } = useProducts();
  const ticket = useTicket();
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
    validateItemWithStock,
    refreshProductAndValidate,
    findProductIdByName,
  } = ticket;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [gramsToAdd, setGramsToAdd] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashGivenError, setCashGivenError] = useState<string | undefined>();
  const [successSale, setSuccessSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Refs para atajos de teclado
  const gramsInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<{ focus: () => void }>(null);
  const customerSearchRef = useRef<{ focus: () => void }>(null);
  const cashGivenInputRef = useRef<HTMLInputElement>(null);

  // Calcular stock disponible para el producto seleccionado
  const getAvailableStockForSelected = useCallback((product: Product | null): number => {
    if (!product) return 0;

    const contextProduct = products.find(p => p.id === product.id);
    const baseStock = contextProduct?.stockGrams ?? product.stockGrams;
    const gramsInTicket = items.reduce((sum, item) => {
      if (item.productId === product.id) {
        return sum + item.grams;
      }
      return sum;
    }, 0);

    return Math.max(0, baseStock - gramsInTicket);
  }, [products, items]);

  // Manejar selección de producto
  const handleProductSelect = useCallback((product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      const stock = getAvailableStockForSelected(product);
      setGramsToAdd(Math.min(1, stock)); // Sugerir 1g o el stock disponible si es menor
    } else {
      setGramsToAdd(0);
    }
  }, [getAvailableStockForSelected]);

  // Agregar producto al ticket
  const handleAddProduct = useCallback(async () => {
    if (!selectedProduct || gramsToAdd <= 0) {
      showToast('Selecciona un producto y especifica los gramos', 'warning');
      return;
    }

    const stock = getAvailableStockForSelected(selectedProduct);
    if (gramsToAdd > stock) {
      showToast(`Stock insuficiente. Disponible: ${stock.toFixed(2)}g`, 'error');
      return;
    }

    // Obtener producto actualizado si no está en cache
    let product = products.find(p => p.id === selectedProduct.id);
    if (!product) {
      try {
        const fetchedProduct = await getProductById(selectedProduct.id);
        product = fetchedProduct || undefined;
      } catch (error) {
        showToast('Error al obtener el producto', 'error');
        return;
      }
    }

    if (!product) {
      showToast('Producto no encontrado', 'error');
      return;
    }

    await addProductToTicket(product, gramsToAdd);
    setSelectedProduct(null);
    setGramsToAdd(0);
    showToast('Producto agregado al ticket', 'success');
  }, [selectedProduct, gramsToAdd, getAvailableStockForSelected, products, getProductById, addProductToTicket, showToast]);

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
        })),
      };

      // Crear venta
      const sale = await createSale(request);

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
                <div className="sale-create-grams-input">
                  <div onKeyDown={(e) => {
                    if (e.key === 'Enter' && gramsToAdd > 0) {
                      e.preventDefault();
                      handleAddProduct();
                    }
                  }}>
                    <NumberInput
                      ref={gramsInputRef}
                      id="gramsToAdd"
                      label="Gramos"
                      value={gramsToAdd}
                      onChange={setGramsToAdd}
                      min={0.01}
                      step={0.01}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="sale-create-stock-info">
                    Stock disponible: <strong>{getAvailableStockForSelected(selectedProduct).toFixed(2)}g</strong>
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
    </>
  );
}
