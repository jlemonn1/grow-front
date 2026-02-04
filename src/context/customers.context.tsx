import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { customersService, type ListCustomersParams } from '@/services/customers.service';
import { useDemo } from './demo.context';
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
  const { isDemoMode, demoData } = useDemo();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentParamsRef = useRef<ListCustomersParams>({});
  const demoDataSyncedRef = useRef<string | null>(null); // Track si ya sincronizamos estos datos
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  // Sincronizar datos mock cuando se activa el modo demo
  useEffect(() => {
    if (isDemoMode && demoData) {
      // Evitar sincronizar si ya tenemos estos datos (usar el primer ID como referencia)
      const demoDataId = demoData.customers.length > 0 ? demoData.customers[0].id : null;
      if (demoDataSyncedRef.current === demoDataId && customers.length > 0) {
        return; // Ya están sincronizados
      }
      
      demoDataSyncedRef.current = demoDataId;
      
      // Filtrar según parámetros de búsqueda si existen
      let filteredCustomers = demoData.customers;
      const params = currentParamsRef.current;
      
      if (params.q) {
        const query = params.q.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c => 
          c.displayName.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.pin.toLowerCase().includes(query)
        );
      }

      // Simular paginación
      const page = params.page || 0;
      const size = params.size || 25;
      const start = page * size;
      const end = start + size;
      const paginatedCustomers = filteredCustomers.slice(start, end);

      setCustomers(paginatedCustomers);
      setPagination({
        page: page,
        size: size,
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / size),
      });
      setLoading(false);
      setError(null);
    } else if (!isDemoMode) {
      // Si se desactiva el modo demo, limpiar referencia
      demoDataSyncedRef.current = null;
      if (customers.length > 0 && demoData) {
        // Solo limpiar si había datos mock
        setCustomers([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode, demoData?.customers.length]); // Solo depender del length para evitar re-renders innecesarios

  const loadCustomers = useCallback(async (params?: ListCustomersParams) => {
    // Si estamos en modo demo, usar datos mock
    if (isDemoMode && demoData) {
      setLoading(true);
      setError(null);
      
      const searchParams = params || currentParamsRef.current;
      currentParamsRef.current = searchParams;

      // Filtrar según parámetros de búsqueda
      let filteredCustomers = demoData.customers;
      
      if (searchParams.q) {
        const query = searchParams.q.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c => 
          c.displayName.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.pin.toLowerCase().includes(query)
        );
      }

      // Simular paginación
      const page = searchParams.page || 0;
      const size = searchParams.size || 25;
      const start = page * size;
      const end = start + size;
      const paginatedCustomers = filteredCustomers.slice(start, end);

      setCustomers(paginatedCustomers);
      setPagination({
        page: page,
        size: size,
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / size),
      });
      setLoading(false);
      return;
    }

    // Modo normal: llamar a la API
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
  }, [isDemoMode, demoData]);

  const refreshCustomers = useCallback(async () => {
    await loadCustomers(currentParamsRef.current);
  }, [loadCustomers]);

  const createCustomer = useCallback(async (data: CreateCustomerRequest): Promise<Customer> => {
    // Si estamos en modo demo, crear cliente mock localmente
    if (isDemoMode && demoData) {
      const newCustomer: Customer = {
        id: crypto.randomUUID ? crypto.randomUUID() : `demo-${Date.now()}`,
        displayName: data.displayName,
        phone: data.phone,
        pin: data.pin,
        subscriptionType: data.subscriptionType || 'MONTHLY',
        subscriptionPrice: data.subscriptionPrice,
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
      // Actualizar cache: agregar el nuevo cliente a la lista
      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    }

    // Modo normal: llamar a la API
    const newCustomer = await customersService.create(data);
    // Actualizar cache: agregar el nuevo cliente a la lista
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  }, [isDemoMode, demoData]);

  const getCustomerById = useCallback(async (id: string): Promise<Customer | null> => {
    // Si estamos en modo demo, buscar en datos mock
    if (isDemoMode && demoData) {
      const mockCustomer = demoData.customers.find((c) => c.id === id);
      if (mockCustomer) {
        return mockCustomer;
      }
      // También buscar en el cache local (por si se creó uno nuevo)
      const cachedCustomer = customers.find((c) => c.id === id);
      return cachedCustomer || null;
    }

    // Modo normal: primero buscar en cache
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
  }, [customers, isDemoMode, demoData]);

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
