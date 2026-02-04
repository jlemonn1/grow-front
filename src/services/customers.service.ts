import { get, post, postFormData, put, putFormData, del } from './http';
import type { 
  Customer, 
  CustomerSale, 
  CustomerSummary,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  RenewSubscriptionRequest,
  PinCheckResponse,
  BalanceTransaction,
  AdjustBalanceRequest,
  TransferBalanceRequest,
  Product
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
  async create(data: CreateCustomerRequest & {
    profilePicture?: File;
    dniPicture?: File;
  }): Promise<Customer> {
    // Si hay archivos, usar FormData
    if (data.profilePicture || data.dniPicture) {
      const formData = new FormData();
      formData.append('displayName', data.displayName);
      if (data.phone) formData.append('phone', data.phone);
      if (data.notes) formData.append('notes', data.notes);
      formData.append('pin', data.pin);
      if (data.subscriptionType) formData.append('subscriptionType', data.subscriptionType);
      formData.append('subscriptionPrice', data.subscriptionPrice.toString());
      if (data.profilePicture) formData.append('profilePicture', data.profilePicture);
      if (data.dniPicture) formData.append('dniPicture', data.dniPicture);
      if (data.dniNumber) formData.append('dniNumber', data.dniNumber);
      
      return postFormData<Customer>('/customers', formData);
    } else {
      // Si no hay archivos, usar JSON normal
      return post<Customer>('/customers', data);
    }
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
   * Actualiza un cliente existente
   */
  async update(customerId: string, data: UpdateCustomerRequest & {
    profilePicture?: File;
    dniPicture?: File;
  }): Promise<Customer> {
    // Si hay archivos, usar FormData
    if (data.profilePicture || data.dniPicture) {
      const formData = new FormData();
      if (data.displayName) formData.append('displayName', data.displayName);
      if (data.phone !== undefined) formData.append('phone', data.phone || '');
      if (data.notes !== undefined) formData.append('notes', data.notes || '');
      if (data.pin) formData.append('pin', data.pin);
      if (data.subscriptionType) formData.append('subscriptionType', data.subscriptionType);
      if (data.subscriptionPrice !== undefined) formData.append('subscriptionPrice', data.subscriptionPrice.toString());
      if (data.profilePicture) formData.append('profilePicture', data.profilePicture);
      if (data.dniPicture) formData.append('dniPicture', data.dniPicture);
      if (data.dniNumber !== undefined) formData.append('dniNumber', data.dniNumber || '');
      
      return putFormData<Customer>(`/customers/${customerId}`, formData);
    } else {
      // Si no hay archivos, usar JSON normal
      return put<Customer>(`/customers/${customerId}`, data);
    }
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

  /**
   * Busca clientes públicamente (sin autenticación, modo visitante)
   */
  async searchPublic(params?: ListCustomersParams): Promise<PageResponse<Customer>> {
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
    const endpoint = `/public/customers${queryString ? `?${queryString}` : ''}`;

    return get<PageResponse<Customer>>(endpoint);
  },

  /**
   * Ajusta el saldo de un cliente (agregar o quitar)
   */
  async adjustBalance(customerId: string, data: AdjustBalanceRequest): Promise<Customer> {
    return post<Customer>(`/customers/${customerId}/balance/adjust`, data);
  },

  /**
   * Transfiere saldo de un cliente a otro
   */
  async transferBalance(customerId: string, data: TransferBalanceRequest): Promise<void> {
    return post<void>(`/customers/${customerId}/balance/transfer`, data);
  },

  /**
   * Obtiene el historial de transacciones de saldo de un cliente
   */
  async getBalanceHistory(customerId: string, page?: number, size?: number): Promise<PageResponse<BalanceTransaction>> {
    const queryParams = new URLSearchParams();
    if (page !== undefined) {
      queryParams.append('page', page.toString());
    }
    if (size !== undefined) {
      queryParams.append('size', size.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/customers/${customerId}/balance/history${queryString ? `?${queryString}` : ''}`;

    return get<PageResponse<BalanceTransaction>>(endpoint);
  },

  /**
   * Obtiene los productos recomendados para un cliente
   * Solo devuelve productos con stock disponible
   */
  async getRecommendedProducts(customerId: string): Promise<Product[]> {
    return get<Product[]>(`/customers/${customerId}/recommended-products`);
  },
};
