import { post, get } from './http';
import type { PageResponse } from '@/types/api';
import type { StockMovement, RechargeStockRequest, StockMovementParams } from '@/types/models';

/**
 * Recarga stock de un producto
 */
export async function rechargeStock(
  productId: string,
  grams: number,
  note?: string
): Promise<StockMovement> {
  const body: RechargeStockRequest = { grams, note };
  return post<StockMovement>(`/products/${productId}/stock/recharges`, body);
}

/**
 * Obtiene el historial de movimientos de stock de un producto
 */
export async function getStockMovements(
  productId: string,
  params?: StockMovementParams
): Promise<PageResponse<StockMovement>> {
  const queryParams = new URLSearchParams();

  if (params?.type) {
    queryParams.append('type', params.type);
  }
  if (params?.from) {
    queryParams.append('from', params.from);
  }
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.size !== undefined) {
    queryParams.append('size', params.size.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/products/${productId}/stock/movements${queryString ? `?${queryString}` : ''}`;

  return get<PageResponse<StockMovement>>(endpoint);
}
