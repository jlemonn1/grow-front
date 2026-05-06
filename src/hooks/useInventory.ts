import { useState, useCallback, useMemo } from 'react';
import { getInventory, completeInventory } from '@/services/inventory.service';
import { useUI } from '@/context/ui.context';
import type { InventoryProduct, InventoryItem, InventoryAction, CompleteInventoryRequest } from '@/types/models';

interface ProductInventoryState {
  [productId: string]: {
    checked: boolean;
    action?: InventoryAction;
    grams?: number;
    note?: string;
  };
}

export function useInventory() {
  const { showToast } = useUI();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productStates, setProductStates] = useState<ProductInventoryState>({});

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setProducts(data);
      const initialStates: ProductInventoryState = {};
      data.forEach(p => {
        initialStates[p.id] = { checked: false };
      });
      setProductStates(initialStates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar inventario';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const checkProduct = useCallback((productId: string) => {
    setProductStates(prev => ({
      ...prev,
      [productId]: { checked: true, action: 'CHECK' }
    }));
  }, []);

  const uncheckProduct = useCallback((productId: string) => {
    setProductStates(prev => ({
      ...prev,
      [productId]: { checked: false }
    }));
  }, []);

  const rechargeProduct = useCallback((productId: string, grams: number, note?: string) => {
    setProductStates(prev => ({
      ...prev,
      [productId]: { checked: true, action: 'RECHARGE', grams, note }
    }));
  }, []);

  const setProductStock = useCallback((productId: string, grams: number, note?: string) => {
    setProductStates(prev => ({
      ...prev,
      [productId]: { checked: true, action: 'SET', grams, note }
    }));
  }, []);

  const checkedCount = useMemo(() => {
    return Object.values(productStates).filter(s => s.checked).length;
  }, [productStates]);

  const totalCount = products.length;

  const complete = useCallback(async (): Promise<boolean> => {
    const items: InventoryItem[] = [];
    
    Object.entries(productStates).forEach(([productId, state]) => {
      if (state.checked && state.action) {
        items.push({
          productId,
          action: state.action,
          grams: state.grams,
          note: state.note
        });
      }
    });

    if (items.length === 0) {
      showToast('No hay productos verificados para procesar', 'warning');
      return false;
    }

    if (items.length < totalCount) {
      showToast(`Solo se procesarán ${items.length} de ${totalCount} productos verificados`, 'warning');
    }

    setLoading(true);
    try {
      const request: CompleteInventoryRequest = { items };
      await completeInventory(request);
      showToast('Inventario procesado correctamente', 'success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar inventario';
      showToast(message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [productStates, totalCount, showToast]);

  const groupedProducts = useMemo(() => {
    const groups: { [category: string]: InventoryProduct[] } = {};
    products.forEach(product => {
      const category = product.categoryName || 'Sin categoría';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });
    return groups;
  }, [products]);

  return {
    products,
    loading,
    error,
    productStates,
    checkedCount,
    totalCount,
    groupedProducts,
    loadInventory,
    checkProduct,
    uncheckProduct,
    rechargeProduct,
    setProductStock,
    complete,
  };
}
