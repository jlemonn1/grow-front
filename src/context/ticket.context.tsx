import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { debounce } from '@/utils/debounce';
import { saveSaleDraft, savePendingSale } from '@/services/sales.service';
import { getMeasurementShortLabel } from '@/utils/measurement';
import { setSaveDraftBeforeLogoutCallback } from '@/context/auth.context';
import { useConfig } from '@/context/config.context';
import type { Customer, Product, TicketItem, PendingSale } from '@/types/models';

export interface AppliedCoupon {
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
}

interface TicketContextValue {
  customer: Customer | null;
  items: TicketItem[];
  total: number;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  cashGiven: number;
  change: number;
  isValid: boolean;
  isSavingDraft: boolean;
  useBalance: boolean;
  balanceToUse: number;
  saveChangeToBalance: boolean;
  balanceUsed: number;
  balanceRemaining: number;
  appliedCoupon: AppliedCoupon | null;
  manualDiscountPercent: number | null;
  addItem: (product: Product, grams: number) => void;
  updateItem: (index: number, grams: number) => void;
  removeItem: (index: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setCashGiven: (amount: number) => void;
  setUseBalance: (use: boolean) => void;
  setBalanceToUse: (amount: number) => void;
  setSaveChangeToBalance: (save: boolean) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  setManualDiscount: (percent: number | null) => void;
  validateItem: (index: number, availableStock: number) => void;
  validateAll: (getProductStock: (productId: string, excludeItemIndex?: number) => number) => void;
  reset: () => void;
  calculateTotals: () => void;
  loadDraft: (draft: { customerId?: string | null; items: Array<{ productId: string; grams: number }>; cashGiven: number }, getProductById: (id: string) => Promise<Product | null>) => Promise<void>;
  loadPendingSale: (pendingSale: PendingSale, getProductById: (id: string) => Promise<Product | null>) => Promise<{ selectedProductId: string | null; gramsToAdd: number }>;
  saveAsPendingSale: (selectedProductId: string | null, gramsToAdd: number) => Promise<void>;
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
  const [subtotalBeforeDiscount, setSubtotalBeforeDiscount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [useBalance, setUseBalanceState] = useState<boolean>(false);
  const [balanceToUse, setBalanceToUse] = useState<number>(0);
  const [saveChangeToBalance, setSaveChangeToBalanceState] = useState<boolean>(false);
  const [balanceUsed, setBalanceUsed] = useState<number>(0);
  const [balanceRemaining, setBalanceRemaining] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [manualDiscountPercent, setManualDiscountPercent] = useState<number | null>(null);
  
  // Ref para evitar guardar durante la carga de un borrador
  const isLoadingDraftRef = useRef(false);

  // Función helper para calcular subtotal simple (sin descuento por línea)
  const calculateSubtotal = useCallback((grams: number, pricePerGram: number): number => {
    return grams * pricePerGram;
  }, []);

  const calculateTotals = useCallback(() => {
    const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    setSubtotalBeforeDiscount(itemsTotal);
    
    // Calcular descuento
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        discount = itemsTotal * (appliedCoupon.discountValue / 100);
      } else {
        discount = Math.min(appliedCoupon.discountValue, itemsTotal);
      }
    } else if (manualDiscountPercent && manualDiscountPercent > 0) {
      discount = itemsTotal * (manualDiscountPercent / 100);
    }
    
    const newTotal = Math.max(0, itemsTotal - discount);
    setDiscountAmount(discount);
    setTotal(newTotal);
    
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
  }, [items, cashGiven, customer, useBalance, balanceToUse, appliedCoupon, manualDiscountPercent]);

  const addItem = useCallback((product: Product, grams: number) => {
    if (grams <= 0) {
      return;
    }

    const pricePerGram = product.pricePerGram;
    const subtotal = calculateSubtotal(grams, pricePerGram);

    const newItem: TicketItem = {
      productId: product.id,
      product,
      grams,
      pricePerGram,
      subtotal,
      validationState: 'checking',
      errorMessage: undefined,
    };

    setItems((prev) => {
      return [...prev, newItem];
    });
  }, [calculateSubtotal]);

  const updateItem = useCallback((index: number, grams: number) => {
    if (grams <= 0) {
      return;
    }

    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;

      const subtotal = calculateSubtotal(grams, item.pricePerGram);

      updated[index] = {
        ...item,
        grams,
        subtotal,
        validationState: 'checking',
        errorMessage: undefined,
      };
      return updated;
    });
  }, [calculateSubtotal]);

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
          errorMessage: `La cantidad debe ser mayor a 0`,
        };
      } else if (item.grams > availableStock) {
        const measurementSuffix = getMeasurementShortLabel(item.product?.measurementType ?? 'WEIGHT');
        updated[index] = {
          ...item,
          validationState: 'invalid',
          errorMessage: `Stock insuficiente. Disponible: ${availableStock.toFixed(2)}${measurementSuffix}`,
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
            errorMessage: 'La cantidad debe ser mayor a 0',
          };
      } else if (item.grams > availableStock) {
          const measurementSuffix = getMeasurementShortLabel(item.product?.measurementType ?? 'WEIGHT');
        return {
          ...item,
          validationState: 'invalid',
          errorMessage: `Stock insuficiente. Disponible: ${availableStock.toFixed(2)}${measurementSuffix}`,
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
        })),
      });
      
      // También guardar en localStorage como backup
      localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify({
        customerId: customer?.id || null,
        cashGiven: cashGiven || 0,
        items: items.map(item => ({
          productId: item.productId,
          grams: item.grams,
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
  ): Promise<{ selectedProductId: string | null; gramsToAdd: number }> => {
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
            const pricePerGram = product.pricePerGram;
            const subtotal = calculateSubtotal(draftItem.grams, pricePerGram);
            
            loadedItems.push({
              productId: product.id,
              product: product,
              grams: draftItem.grams,
              pricePerGram,
              subtotal,
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
      };
    } finally {
      isLoadingDraftRef.current = false;
    }
  }, [calculateSubtotal]);

  const saveAsPendingSale = useCallback(async (
    selectedProductId: string | null,
    gramsToAdd: number
  ): Promise<void> => {
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
        })),
        selectedProductId,
        gramsToAdd: gramsToAdd > 0 ? gramsToAdd : null,
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
            const pricePerGram = product.pricePerGram;
            const subtotal = calculateSubtotal(draftItem.grams, pricePerGram);
            
            loadedItems.push({
              productId: product.id,
              product,
              grams: draftItem.grams,
              pricePerGram,
              subtotal,
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
  }, [calculateSubtotal]);

  const applyCoupon = useCallback((coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
    setManualDiscountPercent(null); // Limpiar descuento manual si hay cupón
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const setManualDiscount = useCallback((percent: number | null) => {
    setManualDiscountPercent(percent);
    if (percent !== null) {
      setAppliedCoupon(null); // Limpiar cupón si hay descuento manual
    }
  }, []);

  const reset = useCallback(() => {
    setCustomerState(null);
    setItems([]);
    setCashGivenState(0);
    setTotal(0);
    setSubtotalBeforeDiscount(0);
    setDiscountAmount(0);
    setChange(0);
    setIsValid(false);
    setUseBalanceState(false);
    setSaveChangeToBalanceState(false);
    setBalanceUsed(0);
    setBalanceRemaining(0);
    setAppliedCoupon(null);
    setManualDiscountPercent(null);
    // Limpiar localStorage al resetear
    localStorage.removeItem(TICKET_STORAGE_KEY);
  }, []);

  // Obtener configuración para verificar si el saldo está habilitado
  const { config } = useConfig();
  const enableCustomerBalance = config?.enableCustomerBalance ?? true;

  // Efecto para forzar estado de saldo cuando está deshabilitado
  useEffect(() => {
    if (!enableCustomerBalance) {
      // Si el saldo está deshabilitado, forzar valores a false/0
      if (useBalance) {
        setUseBalanceState(false);
      }
      if (balanceToUse > 0) {
        setBalanceToUse(0);
      }
      if (saveChangeToBalance) {
        setSaveChangeToBalanceState(false);
      }
    }
  }, [enableCustomerBalance]);

  // Recalcular totales cuando cambian items, cashGiven, customer, useBalance, balanceToUse, cupones o descuentos
  useEffect(() => {
    calculateTotals();
  }, [items, cashGiven, customer, useBalance, balanceToUse, appliedCoupon, manualDiscountPercent, calculateTotals]);

  const value: TicketContextValue = {
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
    addItem,
    updateItem,
    removeItem,
    setCustomer,
    setCashGiven,
    setUseBalance,
    setBalanceToUse: setBalanceToUseWrapper,
    setSaveChangeToBalance,
    applyCoupon,
    removeCoupon,
    setManualDiscount,
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
