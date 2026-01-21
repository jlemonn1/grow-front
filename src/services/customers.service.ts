import { get, post, del } from './http';
import type { 
  Customer, 
  CustomerSale, 
  CustomerSummary,
  CreateCustomerRequest,
  RenewSubscriptionRequest,
  PinCheckResponse
} from '@/types/models';
import type { PageResponse } from '@/types/api';

export interface ListCustomersParams {
  q?: string;
  page?: number;
  size?: number;
}

export interface CustomerSalesParams {
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

// Nota: El backend devuelve PageResponse<CustomerSale>, no CustomerSalesResponse
// Mantenemos este tipo para compatibilidad pero no se usa
export interface CustomerSalesResponse {
  items: CustomerSale[];
  page: number;
  size: number;
  total: number;
}

export interface CustomerSummaryParams {
  from?: string;
  to?: string;
}

export const customersService = {
  /**
   * Crea un nuevo cliente
   */
  async create(data: CreateCustomerRequest): Promise<Customer> {
    return post<Customer>('/customers', data);
  },

  /**
   * Busca clientes con filtros opcionales y paginación
   */
  async search(params?: ListCustomersParams): Promise<PageResponse<Customer>> {
    const queryParams = new URLSearchParams();

    if (params?.q) {
      queryParams.append('q', params.q);
    }
    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      queryParams.append('size', params.size.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

    return get<PageResponse<Customer>>(endpoint);
  },

  /**
   * Obtiene un cliente por ID
   */
  async getById(customerId: string): Promise<Customer> {
    return get<Customer>(`/customers/${customerId}`);
  },

  /**
   * Obtiene el historial de ventas de un cliente
   */
  async getSales(customerId: string, params?: CustomerSalesParams): Promise<PageResponse<CustomerSale>> {
    const queryParams = new URLSearchParams();

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
    const endpoint = `/customers/${customerId}/sales${queryString ? `?${queryString}` : ''}`;

    return get<PageResponse<CustomerSale>>(endpoint);
  },

  /**
   * Obtiene el resumen de compras de un cliente
   */
  async getSummary(customerId: string, params?: CustomerSummaryParams): Promise<CustomerSummary> {
    const queryParams = new URLSearchParams();

    if (params?.from) {
      queryParams.append('from', params.from);
    }
    if (params?.to) {
      queryParams.append('to', params.to);
    }

    const queryString = queryParams.toString();
    const endpoint = `/customers/${customerId}/summary${queryString ? `?${queryString}` : ''}`;

    return get<CustomerSummary>(endpoint);
  },

  /**
   * Elimina un cliente permanentemente
   */
  async delete(customerId: string): Promise<void> {
    return del<void>(`/customers/${customerId}`);
  },

  /**
   * Verifica la disponibilidad de un PIN y obtiene sugerencias si está ocupado
   */
  async checkPin(pin: string): Promise<PinCheckResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('pin', pin);
    return get<PinCheckResponse>(`/customers/pin/check?${queryParams.toString()}`);
  },

  /**
   * Renueva la suscripción de un cliente
   */
  async renewSubscription(customerId: string, data: RenewSubscriptionRequest): Promise<Customer> {
    return post<Customer>(`/customers/${customerId}/subscription/renew`, data);
  },
};
