import { get, post, del, put } from './http';
import type { PageResponse } from '@/types/api';
import type { Sale, CreateSaleRequest, SaleDraft, SaveSaleDraftRequest, PendingSale, SavePendingSaleRequest } from '@/types/models';

export interface ListSalesParams {
  customerId?: string;
  from?: string; // ISO_DATE_TIME format
  to?: string; // ISO_DATE_TIME format
  page?: number;
  size?: number;
}

/**
 * Lista ventas con filtros opcionales y paginación
 */
export async function listSales(
  params?: ListSalesParams
): Promise<PageResponse<Sale>> {
  const queryParams = new URLSearchParams();

  if (params?.customerId) {
    queryParams.append('customerId', params.customerId);
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
  const endpoint = `/sales${queryString ? `?${queryString}` : ''}`;

  return get<PageResponse<Sale>>(endpoint);
}

/**
 * Obtiene una venta por su ID
 */
export async function getSaleById(id: string): Promise<Sale> {
  return get<Sale>(`/sales/${id}`);
}

/**
 * Crea una nueva venta
 */
export async function createSale(request: CreateSaleRequest): Promise<Sale> {
  return post<Sale>('/sales', request);
}

/**
 * Guarda o actualiza el borrador de venta del admin actual
 */
export async function saveSaleDraft(draft: SaveSaleDraftRequest): Promise<void> {
  await post<void>('/sales/draft', draft);
}

/**
 * Obtiene el borrador de venta del admin actual
 */
export async function getSaleDraft(): Promise<SaleDraft | null> {
  try {
    return await get<SaleDraft>('/sales/draft');
  } catch (error: any) {
    // Si es 404, no hay borrador (esto es normal, no es un error)
    if (error?.status === 404) {
      return null;
    }
    // Solo loggear otros errores
    console.error('Error al obtener borrador:', error);
    throw error;
  }
}

/**
 * Elimina el borrador de venta del admin actual
 */
export async function deleteSaleDraft(): Promise<void> {
  await del<void>('/sales/draft');
}

/**
 * Limpia el borrador de venta del admin actual sin eliminarlo.
 * Establece customerId=null, items=[], cashGiven=0
 */
export async function clearSaleDraft(): Promise<void> {
  await put<void>('/sales/draft/clear');
}

/**
 * Cancela una venta y restaura el saldo si se usó
 */
export async function cancelSale(saleId: string): Promise<void> {
  await post<void>(`/sales/${saleId}/cancel`);
}

// ========== Funciones de Pedidos Pendientes ==========

/**
 * Guarda o actualiza un pedido pendiente
 */
export async function savePendingSale(draft: SavePendingSaleRequest): Promise<PendingSale> {
  return post<PendingSale>('/sales/pending', draft);
}

/**
 * Obtiene todos los pedidos pendientes del admin actual
 */
export async function getAllPendingSales(): Promise<PendingSale[]> {
  return get<PendingSale[]>('/sales/pending');
}

/**
 * Obtiene un pedido pendiente por ID de cliente
 */
export async function getPendingSaleByCustomerId(customerId: string): Promise<PendingSale | null> {
  try {
    return await get<PendingSale>(`/sales/pending/${customerId}`);
  } catch (error: any) {
    // Si es 404, no hay pendiente (esto es normal, no es un error)
    if (error?.status === 404) {
      return null;
    }
    console.error('Error al obtener pedido pendiente:', error);
    throw error;
  }
}

/**
 * Recupera un pedido pendiente (convierte borrador actual en pendiente primero)
 */
export async function recoverPendingSale(customerId: string): Promise<PendingSale> {
  return post<PendingSale>(`/sales/pending/${customerId}/recover`);
}

/**
 * Elimina un pedido pendiente por ID de cliente
 */
export async function deletePendingSale(customerId: string): Promise<void> {
  await del<void>(`/sales/pending/${customerId}`);
}