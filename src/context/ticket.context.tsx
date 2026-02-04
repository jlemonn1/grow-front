import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { debounce } from '@/utils/debounce';
import { saveSaleDraft, savePendingSale } from '@/services/sales.service';
import { setSaveDraftBeforeLogoutCallback } from '@/context/auth.context';
import type { Customer, Product, TicketItem, PendingSale, DenominationsMap } from '@/types/models';

interface TicketContextValue {
  customer: Customer | null;
  items: TicketItem[];
  total: number;
  cashGiven: number;
  change: number;
  isValid: boolean;
  isSavingDraft: boolean;
  useBalance: boolean;
  balanceToUse: number;
  saveChangeToBalance: boolean;
  balanceUsed: number;
  balanceRemaining: number;
  addItem: (product: Product, grams: number) => void;
  updateItem: (index: number, grams: number) => void;
  updateItemDiscount: (index: number, discount: number | undefined, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | undefined) => void;
  removeItem: (index: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setCashGiven: (amount: number) => void;
  setUseBalance: (use: boolean) => void;
  setBalanceToUse: (amount: number) => void;
  setSaveChangeToBalance: (save: boolean) => void;
  validateItem: (index: number, availableStock: number) => void;
  validateAll: (getProductStock: (productId: string, excludeItemIndex?: number) => number) => void;
  reset: () => void;
  calculateTotals: () => void;
  loadDraft: (draft: { customerId?: string | null; items: Array<{ productId: string; grams: number; discount?: number; discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' }>; cashGiven: number }, getProductById: (id: string) => Promise<Product | null>) => Promise<void>;
  loadPendingSale: (pendingSale: PendingSale, getProductById: (id: string) => Promise<Product | null>) => Promise<{ selectedProductId: string | null; gramsToAdd: number; cashGivenDenominations: DenominationsMap; changeDenominations: DenominationsMap | null }>;
  saveAsPendingSale: (selectedProductId: string | null, gramsToAdd: number, cashGivenDenominations: DenominationsMap, changeDenominations: DenominationsMap | null) => Promise<void>;
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
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [useBalance, setUseBalanceState] = useState<boolean>(false);
  const [balanceToUse, setBalanceToUse] = useState<number>(0);
  const [saveChangeToBalance, setSaveChangeToBalanceState] = useState<boolean>(false);
  const [balanceUsed, setBalanceUsed] = useState<number>(0);
  const [balanceRemaining, setBalanceRemaining] = useState<number>(0);
  
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
    
    // Calcular saldo disponible
    const availableBalance = customer?.balance || 0;
    
    // Validar y ajustar balanceToUse
    let actualBalanceToUse = balanceToUse;
    if (useBalance) {
      // Asegurar que balanceToUse esté entre 0 y el mínimo entre availableBalance y newTotal
      actualBalanceToUse = Math.max(0, Math.min(balanceToUse, availableBalance, newTotal));
    } else {
      actualBalanceToUse = 0;
    }
    
    let newBalanceUsed = actualBalanceToUse;
    let newBalanceRemaining = availableBalance - actualBalanceToUse;
    let newChange = 0;
    
    if (useBalance && actualBalanceToUse > 0) {
      const remainingAmount = newTotal - actualBalanceToUse;
      if (remainingAmount <= 0) {
        // El saldo cubre todo
        newChange = 0;
      } else {
        // Queda dinero por pagar
        newChange = Math.max(0, cashGiven - remainingAmount);
      }
    } else {
      // No usar saldo
      newChange = Math.max(0, cashGiven - newTotal);
    }
    
    setTotal(newTotal);
    setChange(newChange);
    setBalanceUsed(newBalanceUsed);
    setBalanceRemaining(newBalanceRemaining);
    
    // Validar ticket completo
    const hasValidCustomer = customer !== null;
    const hasItems = items.length > 0;
    const allItemsValid = items.every(item => item.validationState === 'valid');
    
    let paymentSufficient = false;
    if (useBalance && actualBalanceToUse >= newTotal) {
      // Si el saldo usado cubre todo, no se requiere efectivo
      paymentSufficient = true;
    } else if (useBalance && actualBalanceToUse < newTotal) {
      // Si se usa saldo parcial, el efectivo debe cubrir el resto
      paymentSufficient = cashGiven >= (newTotal - actualBalanceToUse);
    } else {
      // Sin usar saldo, validación normal
      paymentSufficient = cashGiven >= newTotal;
    }
    
    setIsValid(hasValidCustomer && hasItems && allItemsValid && paymentSufficient);
  }, [items, cashGiven, customer, useBalance, balanceToUse]);

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
      return [...prev, newItem];
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

  const setUseBalance = useCallback((use: boolean) => {
    setUseBalanceState(use);
    if (!use) {
      // Si se desactiva, resetear balanceToUse
      setBalanceToUse(0);
    } else {
      // Si se activa, inicializar con el mínimo entre saldo disponible y total
      const availableBalance = customer?.balance || 0;
      const currentTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const initialBalance = Math.min(availableBalance, currentTotal);
      setBalanceToUse(initialBalance);
    }
  }, [customer, items]);

  // Ajustar balanceToUse cuando cambian el total o el saldo disponible
  useEffect(() => {
    if (useBalance && customer) {
      const availableBalance = customer.balance || 0;
      const currentTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const maxBalance = Math.min(availableBalance, currentTotal);
      
      // Si balanceToUse excede los límites, ajustarlo
      if (balanceToUse > maxBalance) {
        setBalanceToUse(maxBalance);
      } else if (balanceToUse < 0) {
        setBalanceToUse(0);
      }
    }
  }, [useBalance, customer, items, balanceToUse]);

  const handleSetBalanceToUse = useCallback((amount: number) => {
    const availableBalance = customer?.balance || 0;
    const currentTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    // Asegurar que esté entre 0 y el mínimo entre saldo disponible y total
    const clampedAmount = Math.max(0, Math.min(amount, availableBalance, currentTotal));
    setBalanceToUse(clampedAmount);
  }, [customer, items]);

  // Wrapper para setBalanceToUse que valida el valor
  const setBalanceToUseWrapper = useCallback((amount: number) => {
    handleSetBalanceToUse(amount);
  }, [handleSetBalanceToUse]);

  const setSaveChangeToBalance = useCallback((save: boolean) => {
    setSaveChangeToBalanceState(save);
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

    setIsSavingDraft(true);
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
    } finally {
      setIsSavingDraft(false);
    }
  }, [customer, items, cashGiven]);

  // Debounce del guardado automático (800ms) para cambios menores
  const debouncedSaveDraft = useRef(
    debounce(() => {
      saveDraftToBackend();
    }, 800)
  ).current;

  // Ref para rastrear la longitud anterior de items para detectar adiciones
  const prevItemsLengthRef = useRef(items.length);
  const prevCustomerRef = useRef(customer);

  // Guardar inmediatamente cuando se añade un producto o se selecciona un cliente
  useEffect(() => {
    if (isLoadingDraftRef.current) {
      return;
    }

    const itemsLengthChanged = items.length !== prevItemsLengthRef.current;
    const customerChanged = customer !== prevCustomerRef.current;

    // Si se añadió un producto (longitud aumentó) o se cambió el cliente, guardar inmediatamente
    if (itemsLengthChanged && items.length > prevItemsLengthRef.current) {
      // Se añadió un producto
      prevItemsLengthRef.current = items.length;
      saveDraftToBackend();
    } else if (customerChanged) {
      // Se cambió el cliente
      prevCustomerRef.current = customer;
      saveDraftToBackend();
    } else {
      // Otros cambios (modificación de gramos, cashGiven, etc.) usar debounce
      prevItemsLengthRef.current = items.length;
      prevCustomerRef.current = customer;
      debouncedSaveDraft();
    }
  }, [customer, items, cashGiven, debouncedSaveDraft, saveDraftToBackend]);

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

  const loadPendingSale = useCallback(async (
    pendingSale: PendingSale,
    getProductById: (id: string) => Promise<Product | null>
  ): Promise<{ selectedProductId: string | null; gramsToAdd: number; cashGivenDenominations: DenominationsMap; changeDenominations: DenominationsMap | null }> => {
    isLoadingDraftRef.current = true;
    
    try {
      // Cargar cliente si existe
      if (!pendingSale.customerId) {
        setCustomerState(null);
      }
      // Nota: El cliente se debe cargar desde fuera usando el servicio de clientes
      
      // Cargar items del ticket
      const loadedItems: TicketItem[] = [];
      for (const draftItem of pendingSale.items) {
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
              product: product,
              grams: draftItem.grams,
              pricePerGram,
              subtotal,
              subtotalBeforeDiscount,
              discount: draftItem.discount,
              discountType: draftItem.discountType,
              validationState: 'checking' as const,
              errorMessage: undefined,
            });
          }
        } catch (error) {
          console.warn(`No se pudo cargar producto ${draftItem.productId} del pendiente:`, error);
        }
      }
      
      setItems(loadedItems);
      setCashGivenState(pendingSale.cashGiven || 0);
      
      // Configuración de saldo
      setUseBalanceState(pendingSale.useBalance || false);
      setBalanceToUse(pendingSale.balanceToUse || 0);
      setSaveChangeToBalanceState(pendingSale.saveChangeToBalance || false);
      
      // Retornar información adicional para que la página la use
      return {
        selectedProductId: pendingSale.selectedProductId || null,
        gramsToAdd: pendingSale.gramsToAdd || 0,
        cashGivenDenominations: pendingSale.cashGivenDenominations || {},
        changeDenominations: pendingSale.changeDenominations || null,
      };
    } finally {
      isLoadingDraftRef.current = false;
    }
  }, [calculateSubtotalWithDiscount]);

  const saveAsPendingSale = useCallback(async (
    selectedProductId: string | null,
    gramsToAdd: number,
    cashGivenDenominations: DenominationsMap,
    changeDenominations: DenominationsMap | null
  ) => {
    // Solo guardar si hay cliente seleccionado O al menos un producto añadido
    const hasCustomer = customer !== null;
    const hasItems = items.length > 0;
    
    if (!hasCustomer && !hasItems && !selectedProductId) {
      return; // No hay nada que guardar
    }

    setIsSavingDraft(true);
    try {
      await savePendingSale({
        customerId: customer?.id || null,
        cashGiven: cashGiven || 0,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
          discount: item.discount,
          discountType: item.discountType,
        })),
        selectedProductId,
        gramsToAdd: gramsToAdd > 0 ? gramsToAdd : null,
        cashGivenDenominations: Object.keys(cashGivenDenominations).length > 0 ? cashGivenDenominations : undefined,
        changeDenominations: changeDenominations && Object.keys(changeDenominations).length > 0 ? changeDenominations : undefined,
        useBalance,
        balanceToUse: useBalance ? balanceToUse : undefined,
        saveChangeToBalance,
      });
    } catch (error) {
      console.error('Error al guardar pedido pendiente:', error);
      throw error;
    } finally {
      setIsSavingDraft(false);
    }
  }, [customer, items, cashGiven, useBalance, balanceToUse, saveChangeToBalance]);

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
    setUseBalanceState(false);
    setSaveChangeToBalanceState(false);
    setBalanceUsed(0);
    setBalanceRemaining(0);
    // Limpiar localStorage al resetear
    localStorage.removeItem(TICKET_STORAGE_KEY);
  }, []);

  // Recalcular totales cuando cambian items, cashGiven, customer, useBalance, balanceToUse
  useEffect(() => {
    calculateTotals();
  }, [items, cashGiven, customer, useBalance, balanceToUse, calculateTotals]);

  const value: TicketContextValue = {
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
    addItem,
    updateItem,
    updateItemDiscount,
    removeItem,
    setCustomer,
    setCashGiven,
    setUseBalance,
    setBalanceToUse: setBalanceToUseWrapper,
    setSaveChangeToBalance,
    validateItem,
    validateAll,
    reset,
    calculateTotals,
    loadDraft,
    loadPendingSale,
    saveAsPendingSale,
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
