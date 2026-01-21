import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { customersService, type ListCustomersParams } from '@/services/customers.service';
import type { Customer, CreateCustomerRequest } from '@/types/models';
import type { PageResponse } from '@/types/api';

interface CustomersContextValue {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  loadCustomers: (params?: ListCustomersParams) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  createCustomer: (data: CreateCustomerRequest) => Promise<Customer>;
  getCustomerById: (id: string) => Promise<Customer | null>;
  addCustomer: (customer: Customer) => void;
}

const CustomersContext = createContext<CustomersContextValue | undefined>(undefined);

interface CustomersContextProviderProps {
  children: ReactNode;
}

export function CustomersContextProvider({ children }: CustomersContextProviderProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentParamsRef = useRef<ListCustomersParams>({});
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  const loadCustomers = useCallback(async (params?: ListCustomersParams) => {
    setLoading(true);
    setError(null);
    
    const searchParams = params || currentParamsRef.current;
    currentParamsRef.current = searchParams;

    try {
      const response: PageResponse<Customer> = await customersService.search(searchParams);
      setCustomers(response.content);
      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar clientes';
      setError(errorMessage);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    await loadCustomers(currentParamsRef.current);
  }, [loadCustomers]);

  const createCustomer = useCallback(async (data: CreateCustomerRequest): Promise<Customer> => {
    const newCustomer = await customersService.create(data);
    // Actualizar cache: agregar el nuevo cliente a la lista
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  }, []);

  const getCustomerById = useCallback(async (id: string): Promise<Customer | null> => {
    // Primero buscar en cache
    const cachedCustomer = customers.find((c) => c.id === id);
    if (cachedCustomer) {
      return cachedCustomer;
    }
    
    // Si no está en cache, obtener desde API
    try {
      const customer = await customersService.getById(id);
      // Agregar al cache si no está en la lista
      setCustomers((prev) => {
        const exists = prev.some((c) => c.id === id);
        return exists ? prev : [...prev, customer];
      });
      return customer;
    } catch (err) {
      return null;
    }
  }, [customers]);

  const addCustomer = useCallback((customer: Customer) => {
    setCustomers((prev) => {
      // Evitar duplicados
      if (prev.some((c) => c.id === customer.id)) {
        return prev;
      }
      return [...prev, customer];
    });
  }, []);

  const value: CustomersContextValue = {
    customers,
    loading,
    error,
    pagination,
    loadCustomers,
    refreshCustomers,
    createCustomer,
    getCustomerById,
    addCustomer,
  };

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers debe usarse dentro de CustomersContextProvider');
  }
  return context;
}

// Alias para mantener compatibilidad con el nombre usado en AppProviders
export const CustomersProvider = CustomersContextProvider;
