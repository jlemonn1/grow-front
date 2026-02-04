import { get, post } from './http';
import type { PageResponse } from '@/types/api';
import type { 
  CajaFuerte, 
  CajaFuerteTransaction, 
  CajaFuerteTransactionParams,
  AddMoneyRequest,
  WithdrawMoneyRequest,
  ChangeDenominationsRequest,
  DenominationsMap
} from '@/types/models';

/**
 * Obtiene el estado actual de la CajaFuerte
 */
export async function getCurrentState(): Promise<CajaFuerte> {
  return get<CajaFuerte>('/cajafuerte');
}

/**
 * Añade dinero a la CajaFuerte
 */
export async function addMoney(request: AddMoneyRequest): Promise<CajaFuerte> {
  return post<CajaFuerte>('/cajafuerte/add', request);
}

/**
 * Retira dinero de la CajaFuerte
 */
export async function withdrawMoney(request: WithdrawMoneyRequest): Promise<CajaFuerte> {
  return post<CajaFuerte>('/cajafuerte/withdraw', request);
}

/**
 * Cambia denominaciones (intercambio de billetes/monedas)
 */
export async function changeDenominations(request: ChangeDenominationsRequest): Promise<CajaFuerte> {
  return post<CajaFuerte>('/cajafuerte/change', request);
}

/**
 * Calcula el cambio óptimo usando las denominaciones disponibles en CajaFuerte
 */
export async function calculateOptimalChange(amount: number): Promise<{ 
  denominations: DenominationsMap; 
  total: number;
  remaining?: number;
  isPartial?: boolean;
}> {
  return post<{ 
    denominations: DenominationsMap; 
    total: number;
    remaining?: number;
    isPartial?: boolean;
  }>('/cajafuerte/calculate-change', { amount });
}

/**
 * Obtiene el historial de transacciones de la CajaFuerte
 */
export async function getTransactions(
  params?: CajaFuerteTransactionParams
): Promise<PageResponse<CajaFuerteTransaction>> {
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
  const endpoint = `/cajafuerte/transactions${queryString ? `?${queryString}` : ''}`;

  return get<PageResponse<CajaFuerteTransaction>>(endpoint);
}
