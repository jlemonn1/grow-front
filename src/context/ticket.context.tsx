import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { debounce } from '@/utils/debounce';
import { saveSaleDraft } from '@/services/sales.service';
import { setSaveDraftBeforeLogoutCallback } from '@/context/auth.context';
import type { Customer, Product, TicketItem } from '@/types/models';

interface TicketContextValue {
  customer: Customer | null;
  items: TicketItem[];
  total: number;
  cashGiven: number;
  change: number;
  isValid: boolean;
  addItem: (product: Product, grams: number) => void;
  updateItem: (index: number, grams: number) => void;
  updateItemDiscount: (index: number, discount: number | undefined, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | undefined) => void;
  removeItem: (index: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setCashGiven: (amount: number) => void;
  validateItem: (index: number, availableStock: number) => void;
  validateAll: (getProductStock: (productId: string, excludeItemIndex?: number) => number) => void;
  reset: () => void;
  calculateTotals: () => void;
  loadDraft: (draft: { customerId?: string | null; items: Array<{ productId: string; grams: number; discount?: number; discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' }>; cashGiven: number }, getProductById: (id: string) => Promise<Product | null>) => Promise<void>;
  setIsLoadingDraft: (loading: boolean) => void;
}

const TicketContext = createContext<TicketContextValue | undefined>(undefined);
const TICKET_STORAGE_KEY = 'growshop_ticket';

interface TicketProviderProps {
  children: ReactNode;
}

export function TicketProvider({ children }: TicketProviderProps) {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [items, setItems] = useState<TicketItem[]>([]);
  const [cashGiven, setCashGivenState] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(false);
  
  // Ref para evitar guardar durante la carga de un borrador
  const isLoadingDraftRef = useRef(false);

  // Función helper para calcular subtotal con descuento
  const calculateSubtotalWithDiscount = useCallback((
    grams: number,
    pricePerGram: number,
    discount?: number,
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT'
  ): { subtotal: number; subtotalBeforeDiscount: number } => {
    const subtotalBeforeDiscount = grams * pricePerGram;
    
    if (discount !== undefined && discountType) {
      if (discountType === 'PERCENTAGE') {
        const subtotal = subtotalBeforeDiscount * (1 - discount / 100);
        return { subtotal, subtotalBeforeDiscount };
      } else if (discountType === 'FIXED_AMOUNT') {
        const subtotal = Math.max(0, subtotalBeforeDiscount - discount);
        return { subtotal, subtotalBeforeDiscount };
      }
    }
    
    return { subtotal: subtotalBeforeDiscount, subtotalBeforeDiscount };
  }, []);

  const calculateTotals = useCallback(() => {
    const newTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const newChange = Math.max(0, cashGiven - newTotal);
    setTotal(newTotal);
    setChange(newChange);
    
    // Validar ticket completo
    const hasValidCustomer = customer !== null;
    const hasItems = items.length > 0;
    const allItemsValid = items.every(item => item.validationState === 'valid');
    const cashSufficient = cashGiven >= newTotal;
    
    setIsValid(hasValidCustomer && hasItems && allItemsValid && cashSufficient);
  }, [items, cashGiven, customer]);

  const addItem = useCallback((product: Product, grams: number) => {
    if (grams <= 0) {
      return;
    }

    // Calcular precio de oferta: priorizar porcentaje, luego precio fijo
    let pricePerGram = product.pricePerGram;
    if (product.onSale) {
      if (product.saleDiscountPercent !== undefined && product.saleDiscountPercent > 0) {
        // Calcular precio con porcentaje de descuento
        pricePerGram = product.pricePerGram * (1 - product.saleDiscountPercent / 100);
      } else if (product.salePricePerGram !== undefined) {
        // Usar precio fijo de oferta
        pricePerGram = product.salePricePerGram;
      }
    }
    const { subtotal, subtotalBeforeDiscount } = calculateSubtotalWithDiscount(
      grams,
      pricePerGram
    );

    const newItem: TicketItem = {
      productId: product.id,
      product,
      grams,
      pricePerGram,
      subtotal,
      subtotalBeforeDiscount,
      validationState: 'checking',
      errorMessage: undefined,
    };

    setItems((prev) => {
      const updated = [...prev, newItem];
      return updated;
    });
  }, [calculateSubtotalWithDiscount]);

  const updateItem = useCallback((index: number, grams: number) => {
    if (grams <= 0) {
      return;
    }

    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;

      const { subtotal, subtotalBeforeDiscount } = calculateSubtotalWithDiscount(
        grams,
        item.pricePerGram,
        item.discount,
        item.discountType
      );

      updated[index] = {
        ...item,
        grams,
        subtotal,
        subtotalBeforeDiscount,
        validationState: 'checking',
        errorMessage: undefined,
      };
      return updated;
    });
  }, [calculateSubtotalWithDiscount]);

  const updateItemDiscount = useCallback((
    index: number,
    discount: number | undefined,
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | undefined
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;

      // Validar descuento
      if (discount !== undefined && discountType) {
        const subtotalBeforeDiscount = item.grams * item.pricePerGram;
        
        if (discountType === 'PERCENTAGE') {
          if (discount < 0 || discount > 100) {
            // No actualizar si el descuento es inválido
            return prev;
          }
        } else if (discountType === 'FIXED_AMOUNT') {
          if (discount < 0 || discount > subtotalBeforeDiscount) {
            // No actualizar si el descuento es inválido
            return prev;
          }
        }
      }

      const { subtotal, subtotalBeforeDiscount } = calculateSubtotalWithDiscount(
        item.grams,
        item.pricePerGram,
        discount,
        discountType
      );

      updated[index] = {
        ...item,
        discount,
        discountType,
        subtotal,
        subtotalBeforeDiscount,
        validationState: 'checking',
        errorMessage: undefined,
      };
      return updated;
    });
  }, [calculateSubtotalWithDiscount]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setCustomer = useCallback((newCustomer: Customer | null) => {
    setCustomerState(newCustomer);
  }, []);

  const setCashGiven = useCallback((amount: number) => {
    setCashGivenState(amount);
  }, []);

  const validateItem = useCallback((index: number, availableStock: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;

      if (item.grams <= 0) {
        updated[index] = {
          ...item,
          validationState: 'invalid',
          errorMessage: 'Los gramos deben ser mayores a 0',
        };
      } else if (item.grams > availableStock) {
        updated[index] = {
          ...item,
          validationState: 'invalid',
          errorMessage: `Stock insuficiente. Disponible: ${availableStock.toFixed(2)}g`,
        };
      } else {
        updated[index] = {
          ...item,
          validationState: 'valid',
          errorMessage: undefined,
        };
      }
      return updated;
    });
  }, []);

  const validateAll = useCallback((getProductStock: (productId: string, excludeItemIndex?: number) => number) => {
    setItems((prev) => {
      return prev.map((item, index) => {
        // Al validar, excluimos este item del cálculo porque estamos validando si sus gramos son válidos
        const availableStock = getProductStock(item.productId, index);
        if (item.grams <= 0) {
          return {
            ...item,
            validationState: 'invalid',
            errorMessage: 'Los gramos deben ser mayores a 0',
          };
        } else if (item.grams > availableStock) {
          return {
            ...item,
            validationState: 'invalid',
            errorMessage: `Stock insuficiente. Disponible: ${availableStock.toFixed(2)}g`,
          };
        } else {
          return {
            ...item,
            validationState: 'valid',
            errorMessage: undefined,
          };
        }
      });
    });
  }, []);

  // Función para guardar borrador en el backend
  const saveDraftToBackend = useCallback(async () => {
    // No guardar si estamos cargando un borrador
    if (isLoadingDraftRef.current) {
      return;
    }

    // Solo guardar si hay cliente seleccionado O al menos un producto añadido
    const hasCustomer = customer !== null;
    const hasItems = items.length > 0;
    
    if (!hasCustomer && !hasItems) {
      return;
    }

    try {
      await saveSaleDraft({
        customerId: customer?.id || null,
        cashGiven: cashGiven || 0,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
          discount: item.discount,
          discountType: item.discountType,
        })),
      });
      
      // También guardar en localStorage como backup
      localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify({
        customerId: customer?.id || null,
        cashGiven: cashGiven || 0,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
          discount: item.discount,
          discountType: item.discountType,
        })),
      }));
    } catch (error) {
      // Si falla el guardado en backend, mantener en localStorage como backup
      console.error('Error al guardar borrador:', error);
      try {
        localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify({
          customerId: customer?.id || null,
          cashGiven: cashGiven || 0,
          items: items.map(item => ({
            productId: item.productId,
            grams: item.grams,
            discount: item.discount,
            discountType: item.discountType,
          })),
        }));
      } catch (e) {
        // Ignorar errores de localStorage
      }
    }
  }, [customer, items, cashGiven]);

  // Debounce del guardado automático (800ms)
  const debouncedSaveDraft = useRef(
    debounce(() => {
      saveDraftToBackend();
    }, 800)
  ).current;

  // Guardar borrador cuando cambian customer, items o cashGiven
  useEffect(() => {
    if (!isLoadingDraftRef.current) {
      debouncedSaveDraft();
    }
  }, [customer, items, cashGiven, debouncedSaveDraft]);

  // Guardar inmediatamente antes de cerrar la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Guardar inmediatamente sin debounce
      if (!isLoadingDraftRef.current) {
        saveDraftToBackend();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveDraftToBackend]);

  // Registrar callback para guardar borrador antes de logout
  useEffect(() => {
    setSaveDraftBeforeLogoutCallback(saveDraftToBackend);
  }, [saveDraftToBackend]);

  const setIsLoadingDraft = useCallback((loading: boolean) => {
    isLoadingDraftRef.current = loading;
  }, []);

  const loadDraft = useCallback(async (
    draft: { 
      customerId?: string | null; 
      items: Array<{ 
        productId: string; 
        grams: number; 
        discount?: number; 
        discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' 
      }>; 
      cashGiven: number 
    },
    getProductById: (id: string) => Promise<Product | null>
  ) => {
    isLoadingDraftRef.current = true;
    
    try {
      // No modificar el cliente aquí, ya debería estar establecido desde fuera
      // Solo establecer a null si no hay customerId en el draft
      if (!draft.customerId) {
        setCustomerState(null);
      }
      
      // Cargar items
      const loadedItems: TicketItem[] = [];
      for (const draftItem of draft.items) {
        try {
          const product = await getProductById(draftItem.productId);
          if (product) {
            let pricePerGram = product.pricePerGram;
            if (product.onSale) {
              if (product.saleDiscountPercent !== undefined && product.saleDiscountPercent > 0) {
                pricePerGram = product.pricePerGram * (1 - product.saleDiscountPercent / 100);
              } else if (product.salePricePerGram !== undefined) {
                pricePerGram = product.salePricePerGram;
              }
            }
            
            const { subtotal, subtotalBeforeDiscount } = calculateSubtotalWithDiscount(
              draftItem.grams,
              pricePerGram,
              draftItem.discount,
              draftItem.discountType
            );
            
            loadedItems.push({
              productId: product.id,
              product,
              grams: draftItem.grams,
              pricePerGram,
              subtotal,
              subtotalBeforeDiscount,
              discount: draftItem.discount,
              discountType: draftItem.discountType,
              validationState: 'checking',
              errorMessage: undefined,
            });
          }
        } catch (error) {
          console.warn(`No se pudo cargar producto ${draftItem.productId} del borrador:`, error);
        }
      }
      
      setItems(loadedItems);
      setCashGivenState(draft.cashGiven || 0);
    } finally {
      isLoadingDraftRef.current = false;
    }
  }, [calculateSubtotalWithDiscount]);

  const reset = useCallback(() => {
    setCustomerState(null);
    setItems([]);
    setCashGivenState(0);
    setTotal(0);
    setChange(0);
    setIsValid(false);
    // Limpiar localStorage al resetear
    localStorage.removeItem(TICKET_STORAGE_KEY);
  }, []);

  // Recalcular totales cuando cambian items, cashGiven o customer
  useEffect(() => {
    calculateTotals();
  }, [items, cashGiven, customer, calculateTotals]);

  const value: TicketContextValue = {
    customer,
    items,
    total,
    cashGiven,
    change,
    isValid,
    addItem,
    updateItem,
    updateItemDiscount,
    removeItem,
    setCustomer,
    setCashGiven,
    validateItem,
    validateAll,
    reset,
    calculateTotals,
    loadDraft,
    setIsLoadingDraft,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTicket() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTicket debe usarse dentro de TicketProvider');
  }
  return context;
}
