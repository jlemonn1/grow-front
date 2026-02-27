import { useCallback, useEffect, useRef } from 'react';
import { useTicket as useTicketContext } from '@/context/ticket.context';
import { useProducts } from '@/context/products.context';
import type { Product } from '@/types/models';

/**
 * Hook wrapper para TicketContext con validaciones adicionales
 * e integración con ProductsContext para validar stock
 */
export function useTicket() {
  const ticket = useTicketContext();
  const { products, getProductById, refreshProduct } = useProducts();

  const getBaseStock = useCallback((productId: string): number | null => {
    // Siempre priorizar el stock del contexto de productos (más actualizado)
    const product = products.find(p => p.id === productId);
    if (product) {
      return product.stockGrams;
    }

    // Solo usar el stock del item como fallback si no está en el contexto
    // Esto puede pasar durante la carga inicial, pero debería actualizarse pronto
    const itemWithProduct = ticket.items.find(
      item => item.productId === productId && item.product
    );
    if (itemWithProduct?.product) {
      return itemWithProduct.product.stockGrams;
    }

    return null;
  }, [products, ticket.items]);

  const computeAvailableStock = useCallback((
    productId: string,
    baseStock: number,
    excludeItemIndex?: number
  ): number => {
    const gramsInTicket = ticket.items.reduce((sum, item, index) => {
      // Si se especifica excludeItemIndex, no contar ese item (útil para validación)
      if (item.productId === productId && index !== excludeItemIndex) {
        return sum + item.grams;
      }
      return sum;
    }, 0);

    // Stock disponible = stock total - gramos ya en el ticket
    return Math.max(0, baseStock - gramsInTicket);
  }, [ticket.items]);

  /**
   * Obtiene el stock disponible de un producto
   * Resta los gramos que ya están en el ticket para ese producto
   */
  const getProductStock = useCallback((productId: string, excludeItemIndex?: number): number => {
    const baseStock = getBaseStock(productId);
    if (baseStock === null) return 0;

    return computeAvailableStock(productId, baseStock, excludeItemIndex);
  }, [getBaseStock, computeAvailableStock]);

  /**
   * Valida un item específico usando el stock actual
   * Excluye el item que se está validando del cálculo de stock disponible
   */
  const validateItemWithStock = useCallback((index: number) => {
    const item = ticket.items[index];
    if (!item) return;

    // Al validar, excluimos este item del cálculo porque estamos validando si sus gramos son válidos
    const availableStock = getProductStock(item.productId, index);
    ticket.validateItem(index, availableStock);
  }, [ticket, getProductStock]);

  /**
   * Valida todos los items del ticket
   */
  const validateAllItems = useCallback(() => {
    ticket.validateAll(getProductStock);
  }, [ticket, getProductStock]);

  /**
   * Agrega un producto al ticket con validación inicial
   */
  const addProductToTicket = useCallback(async (product: Product, grams: number, actualWeighedGrams?: number) => {
    // Obtener producto actualizado si no está en cache
    let currentProduct: Product | undefined = products.find(p => p.id === product.id);
    if (!currentProduct) {
      try {
        const fetchedProduct = await getProductById(product.id);
        currentProduct = fetchedProduct ?? undefined;
      } catch {
        // Si falla, usar el producto pasado
        currentProduct = product;
      }
    }

    // Si aún no tenemos producto, no podemos continuar
    if (!currentProduct) {
      console.error('No se pudo obtener el producto para agregar al ticket');
      return;
    }

    // Obtener el índice antes de agregar (será el índice del nuevo item)
    const newItemIndex = ticket.items.length;

    // Calcular stock disponible ANTES de agregar el item usando el stock real del producto
    // Esto nos da el stock disponible sin contar el item que vamos a agregar
    const availableStockBeforeAdd = computeAvailableStock(
      currentProduct.id,
      currentProduct.stockGrams
    );
    
    // Agregar el item
    ticket.addItem(currentProduct, grams, actualWeighedGrams);
    
    // Validar inmediatamente usando el stock calculado antes de agregar
    // El índice es correcto porque sabemos que el nuevo item estará en newItemIndex
    ticket.validateItem(newItemIndex, availableStockBeforeAdd);
  }, [ticket, products, getProductById, computeAvailableStock]);

  /**
   * Actualiza gramos de un item y valida
   */
  const updateItemGrams = useCallback((index: number, grams: number) => {
    // Calcular stock disponible antes de actualizar
    const item = ticket.items[index];
    if (!item) return;

    const availableStock = getProductStock(item.productId, index);

    // Actualizar el item
    ticket.updateItem(index, grams);

    // Validar inmediatamente con el stock calculado
    ticket.validateItem(index, availableStock);
  }, [ticket, getProductStock]);

  /**
   * Refresca un producto desde la API y valida el item correspondiente
   */
  const refreshProductAndValidate = useCallback(async (productId: string) => {
    try {
      await refreshProduct(productId);
      // Encontrar el índice del item con este productId
      const itemIndex = ticket.items.findIndex(item => item.productId === productId);
      if (itemIndex >= 0) {
        validateItemWithStock(itemIndex);
      }
    } catch (error) {
      console.error('Error al refrescar producto:', error);
    }
  }, [ticket.items, refreshProduct, validateItemWithStock]);

  /**
   * Encuentra el productId de un producto por su nombre
   */
  const findProductIdByName = useCallback((productName: string): string | null => {
    const product = products.find(p => 
      p.name.toLowerCase().includes(productName.toLowerCase())
    );
    return product?.id ?? null;
  }, [products]);

  /**
   * Asegura que un producto esté en el contexto de productos antes de usarlo
   * Si no está, lo carga desde la API y espera a que React procese la actualización
   */
  const ensureProductInContext = useCallback(async (product: Product): Promise<Product> => {
    // Verificar si está en contexto
    let productInContext = products.find(p => p.id === product.id);
    
    if (!productInContext) {
      // Cargar desde API
      const fetched = await getProductById(product.id);
      if (!fetched) {
        throw new Error(`Producto ${product.id} no encontrado`);
      }
      productInContext = fetched;
      
      // Esperar un frame para que React procese la actualización
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    return productInContext;
  }, [products, getProductById]);

  // Restaurar productos cuando se carga el ticket desde localStorage
  useEffect(() => {
    const itemsWithoutProduct = ticket.items.filter(item => !item.product);
    if (itemsWithoutProduct.length > 0 && products.length > 0) {
      // Intentar cargar productos faltantes
      itemsWithoutProduct.forEach(async (item) => {
        try {
          await getProductById(item.productId);
          // Actualizar el item con el producto cargado
          // Esto se hace a través del contexto, pero necesitamos una forma de actualizar
          // Por ahora, la validación se encargará de mostrar errores si el producto no existe
        } catch (error) {
          console.warn(`Producto ${item.productId} no encontrado al restaurar ticket`);
        }
      });
    }
  }, [ticket.items, products, getProductById]);

  // Validar todos los items cuando cambia el stock de productos
  // Usamos useRef para evitar ciclos infinitos
  const isValidatingRef = useRef(false);
  const lastProductsHashRef = useRef<string>('');
  
  useEffect(() => {
    if (ticket.items.length === 0 || isValidatingRef.current) {
      return;
    }

    // Crear un hash de los stocks de productos para detectar cambios reales
    const productsHash = products
      .map(p => `${p.id}:${p.stockGrams}`)
      .sort()
      .join('|');

    // Solo validar si el hash de productos cambió (stock real cambió)
    // No validar cuando solo cambian los items del ticket
    if (productsHash !== lastProductsHashRef.current) {
      lastProductsHashRef.current = productsHash;
      isValidatingRef.current = true;
      
      // Validar usando getProductStock que ya está sincronizado con el estado actual
      // Usar requestAnimationFrame para asegurar que se ejecute después del render
      requestAnimationFrame(() => {
        ticket.validateAll(getProductStock);
        isValidatingRef.current = false;
      });
    }
  }, [products, ticket.items.length, ticket.validateAll, getProductStock]);

  return {
    ...ticket,
    getProductStock,
    validateItemWithStock,
    validateAllItems,
    addProductToTicket,
    updateItemGrams,
    refreshProductAndValidate,
    findProductIdByName,
    ensureProductInContext,
    // Exponer métodos del ticket directamente
    removeItem: ticket.removeItem,
    validateItem: ticket.validateItem,
  };
}
