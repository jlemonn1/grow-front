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
  Product,
} from '@/types/models';
import type { PageResponse } from '@/types/api';

export interface ListCustomersParams {
  q?: string;
  type?: 'any' | 'pin' | 'name' | 'phone' | 'dni';
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
    contractSignatureDataUrl?: string;
  }): Promise<Customer> {
    console.log('[customers.service] create called with data:', {
      displayName: data.displayName,
      pin: data.pin,
      hasProfilePicture: !!data.profilePicture,
      hasDniPicture: !!data.dniPicture,
      hasContractSignature: !!data.contractSignatureDataUrl,
      profilePictureName: data.profilePicture?.name,
      profilePictureSize: data.profilePicture?.size,
      dniPictureName: data.dniPicture?.name,
      dniPictureSize: data.dniPicture?.size,
    });

    const requiresFormData = Boolean(
      data.profilePicture ||
      data.dniPicture ||
      data.contractSignatureDataUrl
    );
    console.log('[customers.service] requiresFormData:', requiresFormData);

    if (requiresFormData) {
      const formData = new FormData();
      console.log('[customers.service] Building FormData...');
      const appendIfPresent = (key: string, value: string | number | null | undefined) => {
        if (value === undefined || value === null) return;
        formData.append(key, String(value));
      };

      formData.append('displayName', data.displayName);
      appendIfPresent('phone', data.phone);
      appendIfPresent('notes', data.notes);
      formData.append('pin', data.pin);
      appendIfPresent('subscriptionType', data.subscriptionType);
      appendIfPresent('subscriptionPrice', data.subscriptionPrice);
      if (data.profilePicture) {
        console.log('[customers.service] Appending profilePicture:', data.profilePicture.name, data.profilePicture.size);
        formData.append('profilePicture', data.profilePicture);
      }
      if (data.dniPicture) {
        console.log('[customers.service] Appending dniPicture:', data.dniPicture.name, data.dniPicture.size);
        formData.append('dniPicture', data.dniPicture);
      }
      appendIfPresent('dniNumber', data.dniNumber);
      appendIfPresent('address', data.address);
      appendIfPresent('estimatedMonthlyConsumptionGrams', data.estimatedMonthlyConsumptionGrams);
      appendIfPresent('guarantorId', data.guarantorId);
      appendIfPresent('contractSignatureDataUrl', data.contractSignatureDataUrl);
      appendIfPresent('customerType', data.customerType);

      console.log('[customers.service] FormData built, calling postFormData to /customers/with-files...');
      
      try {
        const result = await postFormData<Customer>('/customers/with-files', formData);
        console.log('[customers.service] Customer created successfully:', result.id);
        return result;
      } catch (error) {
        console.error('[customers.service] Error creating customer:', error);
        throw error;
      }
    }

    console.log('[customers.service] Using regular POST without files...');
    try {
      const result = await post<Customer>('/customers', data);
      console.log('[customers.service] Customer created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[customers.service] Error creating customer:', error);
      throw error;
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
    if (params?.type && params.type !== 'any') {
      queryParams.append('type', params.type);
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
    contractSignatureDataUrl?: string;
  }): Promise<Customer> {
    const requiresFormData = Boolean(
      data.profilePicture ||
      data.dniPicture ||
      data.contractSignatureDataUrl
    );
    if (requiresFormData) {
      const formData = new FormData();
      const appendIfPresent = (key: string, value: string | number | null | undefined) => {
        if (value === undefined || value === null) return;
        formData.append(key, String(value));
      };

      appendIfPresent('displayName', data.displayName);
      appendIfPresent('phone', data.phone);
      appendIfPresent('notes', data.notes);
      appendIfPresent('pin', data.pin);
      appendIfPresent('subscriptionType', data.subscriptionType);
      appendIfPresent('subscriptionPrice', data.subscriptionPrice);
      if (data.profilePicture) {
        formData.append('profilePicture', data.profilePicture);
      }
      if (data.dniPicture) {
        formData.append('dniPicture', data.dniPicture);
      }
      appendIfPresent('dniNumber', data.dniNumber);
      appendIfPresent('address', data.address);
      appendIfPresent('estimatedMonthlyConsumptionGrams', data.estimatedMonthlyConsumptionGrams);
      appendIfPresent('guarantorId', data.guarantorId);
      appendIfPresent('contractSignatureDataUrl', data.contractSignatureDataUrl);
      appendIfPresent('customerType', data.customerType);

      return putFormData<Customer>(`/customers/${customerId}/with-files`, formData);
    }

    return put<Customer>(`/customers/${customerId}`, data);
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

   /**
    * Vacía el saldo de un cliente (solo cuando el saldo está deshabilitado por configuración)
    */
   async clearBalance(customerId: string): Promise<void> {
     return post<void>(`/customers/${customerId}/balance/clear`, { confirm: true });
   },
};
