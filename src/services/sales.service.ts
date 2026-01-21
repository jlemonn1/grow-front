import { get, post } from './http';
import type { PageResponse } from '@/types/api';
import type { Sale, CreateSaleRequest } from '@/types/models';

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
