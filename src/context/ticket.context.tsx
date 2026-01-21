import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
  removeItem: (index: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setCashGiven: (amount: number) => void;
  validateItem: (index: number, availableStock: number) => void;
  validateAll: (getProductStock: (productId: string, excludeItemIndex?: number) => number) => void;
  reset: () => void;
  calculateTotals: () => void;
}

const TicketContext = createContext<TicketContextValue | undefined>(undefined);
const TICKET_STORAGE_KEY = 'growshop_ticket';

interface StoredTicket {
  customer: Customer | null;
  items: Array<{
    productId: string;
    grams: number;
    pricePerGram: number;
    subtotal: number;
  }>;
  cashGiven: number;
}

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

    const pricePerGram = product.pricePerGram;
    const subtotal = grams * pricePerGram;

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
      const updated = [...prev, newItem];
      return updated;
    });
  }, []);

  const updateItem = useCallback((index: number, grams: number) => {
    if (grams <= 0) {
      return;
    }

    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;

      const newSubtotal = grams * item.pricePerGram;
      updated[index] = {
        ...item,
        grams,
        subtotal: newSubtotal,
        validationState: 'checking',
        errorMessage: undefined,
      };
      return updated;
    });
  }, []);

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
    removeItem,
    setCustomer,
    setCashGiven,
    validateItem,
    validateAll,
    reset,
    calculateTotals,
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
