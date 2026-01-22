import { get, post, del } from './http';
import type { PageResponse } from '@/types/api';
import type { Sale, CreateSaleRequest, SaleDraft, SaveSaleDraftRequest } from '@/types/models';

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
