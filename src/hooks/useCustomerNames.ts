import { useState, useCallback } from 'react';
import { customersService } from '@/services/customers.service';

/**
 * Hook para cargar y cachear nombres de clientes por ID
 */
export function useCustomerNames() {
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const loadCustomerName = useCallback(async (customerId: string) => {
    // Si ya tenemos el nombre, no hacer nada
    if (customerNames[customerId]) {
      return;
    }

    // Si ya estamos cargando este ID, no hacer nada
    if (loadingIds.has(customerId)) {
      return;
    }

    setLoadingIds((prev) => new Set(prev).add(customerId));

    try {
      const customer = await customersService.getById(customerId);
      setCustomerNames((prev) => ({
        ...prev,
        [customerId]: customer.displayName,
      }));
    } catch (error) {
      console.error(`Error loading customer name for ${customerId}:`, error);
      // En caso de error, usar el ID como fallback
      setCustomerNames((prev) => ({
        ...prev,
        [customerId]: `Cliente ${customerId.substring(0, 8)}...`,
      }));
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  }, [customerNames, loadingIds]);

  const loadCustomerNames = useCallback(async (customerIds: string[]) => {
    const uniqueIds = [...new Set(customerIds)].filter(
      (id) => !customerNames[id] && !loadingIds.has(id)
    );

    if (uniqueIds.length === 0) {
      return;
    }

    // Cargar todos los nombres en paralelo
    await Promise.all(uniqueIds.map((id) => loadCustomerName(id)));
  }, [customerNames, loadingIds, loadCustomerName]);

  const getCustomerName = useCallback(
    (customerId: string): string => {
      return customerNames[customerId] || `Cliente ${customerId.substring(0, 8)}...`;
    },
    [customerNames]
  );

  return {
    customerNames,
    loadCustomerName,
    loadCustomerNames,
    getCustomerName,
  };
}
