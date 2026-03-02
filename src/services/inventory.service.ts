import { get, post } from './http';
import type { InventoryProduct, CompleteInventoryRequest, StockMovement } from '@/types/models';

export async function getInventory(): Promise<InventoryProduct[]> {
  return get<InventoryProduct[]>('/products/inventory');
}

export async function completeInventory(
  data: CompleteInventoryRequest
): Promise<StockMovement[]> {
  return post<StockMovement[]>('/products/inventory/complete', data);
}
