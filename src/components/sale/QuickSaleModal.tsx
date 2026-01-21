import { useState, useEffect, useCallback, useRef } from 'react';
import { HiX, HiOutlinePlus } from 'react-icons/hi';
import { CustomerPicker } from './CustomerPicker';
import { ProductPicker } from './ProductPicker';
import { CashBillButtons } from './CashBillButtons';
import { ProductImage } from '@/components/common/ProductImage';
import { Button } from '@/components/common/Button';
import { NumberInput } from '@/components/forms/NumberInput';
import { useTicket } from '@/hooks/useTicket';
import { useProducts } from '@/context/products.context';
import { useUI } from '@/context/ui.context';
import { createSale } from '@/services/sales.service';
import { getTopProductsByMovements, type TopProduct } from '@/services/products.service';
import { formatMoney } from '@/utils/money';
import type { Product } from '@/types/models';
import './QuickSaleModal.css';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSaleModal({ isOpen, onClose }: QuickSaleModalProps) {
  const { showToast, setGlobalLoading } = useUI();
  const { products, getProductById, updateProductStock } = useProducts();
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
  } = ticket;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductStock, setSelectedProductStock] = useState<number>(0);
  const [gramsToAdd, setGramsToAdd] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loadingTopProducts, setLoadingTopProducts] = useState(false);
  const [showAddMore, setShowAddMore] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Cargar top productos cuando se abre el modal
  useEffect(() => {
    if (isOpen && customer) {
      loadTopProducts();
    }
  }, [isOpen, customer]);

  const loadTopProducts = async () => {
    setLoadingTopProducts(true);
    try {
      const top = await getTopProductsByMovements(10);
      setTopProducts(top);
    } catch (error) {
      console.error('Error al cargar top productos:', error);
    } finally {
      setLoadingTopProducts(false);
    }
  };

  // Resetear cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedProduct(null);
      setSelectedProductStock(0);
      setGramsToAdd(0);
      setShowAddMore(false);
      setTopProducts([]);
    }
  }, [isOpen, reset]);

  // Actualizar stock del producto seleccionado cuando cambia el contexto de productos
  useEffect(() => {
    if (selectedProduct) {
      const productInContext = products.find(p => p.id === selectedProduct.id);
      if (productInContext) {
        const stock = getProductStock(selectedProduct.id);
        setSelectedProductStock(stock);
      } else {
        // Si no está en el contexto, usar el stock del producto seleccionado
        setSelectedProductStock(selectedProduct.stockGrams);
      }
    }
  }, [selectedProduct, products, getProductStock]);

  // Función centralizada para calcular la altura del modal
  const calculateModalHeight = useCallback(() => {
    const modalContent = modalContentRef.current;
    const modalBody = modalContent?.querySelector('.quick-sale-modal-body') as HTMLElement;
    
    if (!modalContent || !modalBody) return;

    // Calcular altura base del modal body
    let totalHeight = modalBody.scrollHeight;
    const bodyRect = modalBody.getBoundingClientRect();
    const bodyTop = bodyRect.top;

    // Función auxiliar para calcular altura adicional de elementos posicionados absolutamente
    const getAbsoluteElementHeight = (element: HTMLElement): number => {
      const computedStyle = window.getComputedStyle(element);
      const isVisible = computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden' &&
                       element.offsetHeight > 0;
      
      if (!isVisible) return 0;

      const elementRect = element.getBoundingClientRect();
      
      // Si está posicionado absolutamente y se extiende fuera del body
      if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
        const elementBottom = elementRect.bottom;
        const bodyBottom = bodyRect.bottom;
        
        // Si el elemento se extiende más allá del body, agregar esa diferencia
        if (elementBottom > bodyBottom) {
          return elementBottom - bodyBottom;
        }
      }
      
      return 0;
    };

    // 1. Resultados del CustomerPicker
    const customerPickerResults = modalContent.querySelector('.customer-picker-results') as HTMLElement;
    if (customerPickerResults) {
      totalHeight += getAbsoluteElementHeight(customerPickerResults);
    }

    // 2. Resultados del ProductPicker
    const productPickerResults = modalContent.querySelector('.product-picker-results') as HTMLElement;
    if (productPickerResults) {
      totalHeight += getAbsoluteElementHeight(productPickerResults);
    }

    // Agregar padding y márgenes necesarios
    const headerPadding = 16; // padding del header del modal
    const bottomMargin = 10; // margen inferior
    const totalNeededHeight = totalHeight + headerPadding + bottomMargin;

    // Límites máximos razonables
    const maxAllowedHeight = window.innerHeight * 0.95;
    const minHeight = 200; // altura mínima razonable
    const finalHeight = Math.max(minHeight, Math.min(totalNeededHeight, maxAllowedHeight));

    // Aplicar altura al modal con transición suave
    if (totalNeededHeight <= maxAllowedHeight) {
      modalContent.style.maxHeight = `${finalHeight}px`;
      modalContent.style.height = `${finalHeight}px`;
      modalContent.style.overflowY = 'visible';
    } else {
      // Solo usar scroll si realmente es necesario
      modalContent.style.maxHeight = `${maxAllowedHeight}px`;
      modalContent.style.height = 'auto';
      modalContent.style.overflowY = 'auto';
    }
  }, []);

  // Observar cambios en todos los elementos dinámicos del modal
  useEffect(() => {
    if (!isOpen) return;

    let timeoutId: NodeJS.Timeout;
    let rafId: number;

    const debouncedUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          calculateModalHeight();
        });
      }, 50); // Debounce de 50ms
    };

    // Observadores para detectar cambios
    const observers: (MutationObserver | ResizeObserver)[] = [];

    // 1. Observar cambios en el modal body
    const modalBody = modalContentRef.current?.querySelector('.quick-sale-modal-body');
    if (modalBody) {
      const bodyObserver = new MutationObserver(debouncedUpdate);
      bodyObserver.observe(modalBody, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      observers.push(bodyObserver);

      const bodyResizeObserver = new ResizeObserver(debouncedUpdate);
      bodyResizeObserver.observe(modalBody);
      observers.push(bodyResizeObserver);
    }

    // 2. Observar CustomerPicker y sus resultados
    const customerPicker = modalContentRef.current?.querySelector('.customer-picker');
    if (customerPicker) {
      const customerObserver = new MutationObserver(debouncedUpdate);
      customerObserver.observe(customerPicker, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      observers.push(customerObserver);

      // Observar resultados cuando aparezcan
      const checkCustomerResults = () => {
        const results = modalContentRef.current?.querySelector('.customer-picker-results');
        if (results) {
          const resultsObserver = new MutationObserver(debouncedUpdate);
          resultsObserver.observe(results, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
          });
          observers.push(resultsObserver);

          const resultsResizeObserver = new ResizeObserver(debouncedUpdate);
          resultsResizeObserver.observe(results);
          observers.push(resultsResizeObserver);
        }
      };
      checkCustomerResults();
      setTimeout(checkCustomerResults, 200);
    }

    // 3. Observar ProductPicker y sus resultados
    const productPicker = modalContentRef.current?.querySelector('.product-picker');
    if (productPicker) {
      const productObserver = new MutationObserver(debouncedUpdate);
      productObserver.observe(productPicker, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      observers.push(productObserver);

      // Observar resultados cuando aparezcan
      const checkProductResults = () => {
        const results = modalContentRef.current?.querySelector('.product-picker-results');
        if (results) {
          const resultsObserver = new MutationObserver(debouncedUpdate);
          resultsObserver.observe(results, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
          });
          observers.push(resultsObserver);

          const resultsResizeObserver = new ResizeObserver(debouncedUpdate);
          resultsResizeObserver.observe(results);
          observers.push(resultsResizeObserver);
        }
      };
      checkProductResults();
      setTimeout(checkProductResults, 200);
    }

    // 4. Observar lista de productos (cuando se agregan/eliminan)
    const itemsList = modalContentRef.current?.querySelector('.quick-sale-items-list');
    if (itemsList) {
      const itemsObserver = new MutationObserver(debouncedUpdate);
      itemsObserver.observe(itemsList, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      observers.push(itemsObserver);

      const itemsResizeObserver = new ResizeObserver(debouncedUpdate);
      itemsResizeObserver.observe(itemsList);
      observers.push(itemsResizeObserver);
    }

    // 5. Observar galería de top productos
    const topProducts = modalContentRef.current?.querySelector('.quick-sale-top-products');
    if (topProducts) {
      const topProductsObserver = new MutationObserver(debouncedUpdate);
      topProductsObserver.observe(topProducts, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      observers.push(topProductsObserver);

      const topProductsResizeObserver = new ResizeObserver(debouncedUpdate);
      topProductsResizeObserver.observe(topProducts);
      observers.push(topProductsResizeObserver);
    }

    // 6. Observar formulario de agregar producto
    const addProductForm = modalContentRef.current?.querySelector('.quick-sale-add-product');
    if (addProductForm) {
      const addProductObserver = new MutationObserver(debouncedUpdate);
      addProductObserver.observe(addProductForm, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      observers.push(addProductObserver);

      const addProductResizeObserver = new ResizeObserver(debouncedUpdate);
      addProductResizeObserver.observe(addProductForm);
      observers.push(addProductResizeObserver);
    }

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', debouncedUpdate);

    // Actualizar inicialmente y después de delays para asegurar que el DOM esté listo
    calculateModalHeight();
    setTimeout(calculateModalHeight, 100);
    setTimeout(calculateModalHeight, 300);

    return () => {
      // Limpiar todos los observadores
      observers.forEach(observer => observer.disconnect());
      window.removeEventListener('resize', debouncedUpdate);
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen, customer, items.length, selectedProduct, topProducts.length, calculateModalHeight]);

  // Mostrar opción de agregar más cuando hay productos
  useEffect(() => {
    if (items.length > 0) {
      setShowAddMore(true);
    }
  }, [items.length]);

  const handleProductSelect = useCallback(async (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      // Asegurarse de que el producto esté en el contexto antes de obtener el stock
      let productInContext = products.find(p => p.id === product.id);
      if (!productInContext) {
        try {
          // Si no está en el contexto, obtenerlo para actualizar el cache
          productInContext = await getProductById(product.id);
        } catch (error) {
          console.error('Error al obtener producto:', error);
          // Si falla, usar el producto seleccionado directamente
          productInContext = product;
        }
      }
      
      // Calcular stock disponible
      const stock = productInContext ? getProductStock(productInContext.id) : product.stockGrams;
      setSelectedProductStock(stock);
      setGramsToAdd(Math.min(1, stock));
    } else {
      setSelectedProductStock(0);
      setGramsToAdd(0);
    }
  }, [getProductStock, products, getProductById]);

  const handleAddProduct = useCallback(async () => {
    if (!selectedProduct || gramsToAdd <= 0) {
      showToast('Selecciona un producto y especifica los gramos', 'warning');
      return;
    }

    const stock = getProductStock(selectedProduct.id);
    if (gramsToAdd > stock) {
      showToast(`Stock insuficiente. Disponible: ${stock.toFixed(2)}g`, 'error');
      return;
    }

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
    showToast('Producto agregado', 'success');
  }, [selectedProduct, gramsToAdd, getProductStock, products, getProductById, addProductToTicket, showToast]);

  const handleTopProductClick = useCallback(async (topProduct: TopProduct) => {
    try {
      const product = await getProductById(topProduct.id);
      if (product) {
        await handleProductSelect(product);
      }
    } catch (error) {
      showToast('Error al cargar el producto', 'error');
    }
  }, [getProductById, handleProductSelect, showToast]);

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

    try {
      const request = {
        customerId: customer.id,
        cashGiven,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
        })),
      };

      await createSale(request);

      // Actualizar stock optimista
      items.forEach(item => {
        const currentStock = getProductStock(item.productId);
        const newStock = currentStock - item.grams;
        updateProductStock(item.productId, newStock);
      });

      showToast('Venta completada exitosamente', 'success');
      onClose();
    } catch (error) {
      console.error('Error al procesar venta:', error);
      showToast('Error al procesar la venta', 'error');
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  }, [
    isValid,
    customer,
    items,
    cashGiven,
    getProductStock,
    updateProductStock,
    showToast,
    setGlobalLoading,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div className="quick-sale-modal-overlay" onClick={onClose}>
      <div 
        ref={modalContentRef}
        className="quick-sale-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="quick-sale-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          <HiX />
        </button>

        <div className="quick-sale-modal-body">
          {/* Paso 1: Seleccionar Cliente */}
          {!customer && (
            <div className="quick-sale-step">
              <h2 className="quick-sale-step-title">Selecciona un cliente</h2>
              <CustomerPicker
                selectedCustomer={null}
                onSelect={setCustomer}
              />
            </div>
          )}

          {/* Paso 2: Agregar Productos */}
          {customer && (
            <div className="quick-sale-step">
              <h2 className="quick-sale-step-title">Agregar productos</h2>
              
              {!selectedProduct && (
                <>
                  <ProductPicker
                    selectedProduct={null}
                    onSelect={handleProductSelect}
                  />

                  {/* Galería Top 10 */}
                  {topProducts.length > 0 && (
                    <div className="quick-sale-top-products">
                      <div className="quick-sale-top-products-label">Accesos rápidos</div>
                      <div className="quick-sale-top-products-gallery">
                        {topProducts.map((topProduct) => (
                          <button
                            key={topProduct.id}
                            className="quick-sale-top-product-item"
                            onClick={() => handleTopProductClick(topProduct)}
                            type="button"
                            disabled={topProduct.stockGrams <= 0}
                            title={topProduct.name}
                          >
                            <ProductImage
                              imageUrl={topProduct.imageUrl}
                              alt={topProduct.name}
                              size="small"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Formulario para agregar producto seleccionado */}
              {selectedProduct && (
                <div className="quick-sale-add-product">
                  <div className="quick-sale-selected-product">
                    <ProductImage
                      imageUrl={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      size="small"
                    />
                    <div>
                      <div className="quick-sale-product-name">{selectedProduct.name}</div>
                      <div className="quick-sale-product-stock">
                        Stock: {selectedProductStock.toFixed(2)}g
                      </div>
                    </div>
                  </div>
                  <div className="quick-sale-grams-input">
                    <NumberInput
                      id="gramsToAdd"
                      label="Gramos"
                      value={gramsToAdd}
                      onChange={setGramsToAdd}
                      min={0.01}
                      step={0.01}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div className="quick-sale-add-actions">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddProduct}
                      disabled={gramsToAdd <= 0}
                    >
                      <HiOutlinePlus style={{ marginRight: '8px' }} />
                      Agregar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSelectedProduct(null);
                        setGramsToAdd(0);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de productos agregados */}
              {items.length > 0 && (
                <div className="quick-sale-items-list">
                  <h3 className="quick-sale-items-title">Productos en el ticket</h3>
                  {items.map((item, index) => (
                    <div key={index} className="quick-sale-item">
                      <div className="quick-sale-item-info">
                        <div className="quick-sale-item-name">
                          {item.product?.name || 'Producto'}
                        </div>
                        <div className="quick-sale-item-details">
                          {item.grams.toFixed(2)}g × {formatMoney(item.pricePerGram)} = {formatMoney(item.subtotal)}
                        </div>
                      </div>
                      <button
                        className="quick-sale-item-remove"
                        onClick={() => removeItem(index)}
                        type="button"
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="quick-sale-total">
                    Total: <strong>{formatMoney(total)}</strong>
                  </div>
                </div>
              )}

              {/* Opción para agregar más productos */}
              {showAddMore && !selectedProduct && (
                <div className="quick-sale-add-more">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      // El ProductPicker ya está visible, solo necesitamos enfocarlo
                      const input = document.querySelector('.product-picker input') as HTMLInputElement;
                      input?.focus();
                    }}
                  >
                    <HiOutlinePlus style={{ marginRight: '8px' }} />
                    Agregar otro producto
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Dinero recibido (solo cuando hay productos) */}
          {customer && items.length > 0 && (
            <div className="quick-sale-step">
              <h2 className="quick-sale-step-title">Dinero recibido</h2>
              <div className="quick-sale-cash-input">
                <CashBillButtons onAddAmount={(amount) => setCashGiven((cashGiven || 0) + amount)} />
                <NumberInput
                  id="cashGiven"
                  label="Efectivo recibido"
                  value={cashGiven}
                  onChange={setCashGiven}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  autoFocus={items.length > 0 && cashGiven === 0}
                />
                {cashGiven > 0 && (
                  <div className="quick-sale-change">
                    Cambio: <strong>{formatMoney(change)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 4: Botón completar (solo cuando hay dinero) */}
          {customer && items.length > 0 && cashGiven > 0 && (
            <div className="quick-sale-step">
              <Button
                type="button"
                variant="primary"
                onClick={handleProcessSale}
                disabled={!isValid || isProcessing}
                loading={isProcessing}
                className="quick-sale-complete-button"
              >
                Completar Venta
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
