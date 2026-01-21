import { useCustomers as useCustomersContext } from '@/context/customers.context';

/**
 * Hook para acceder al contexto de clientes
 * Proporciona clientes, estado de carga, errores y funciones de carga
 */
export function useCustomers() {
  return useCustomersContext();
}
