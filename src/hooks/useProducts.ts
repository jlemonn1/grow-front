import { useProducts as useProductsContext } from '@/context/products.context';

/**
 * Hook para acceder al contexto de productos
 * Proporciona productos, estado de carga, errores y funciones de carga
 */
export function useProducts() {
  return useProductsContext();
}
