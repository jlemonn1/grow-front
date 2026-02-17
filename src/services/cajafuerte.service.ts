import { get, post } from './http';
import type { PageResponse } from '@/types/api';
import type { 
  CajaFuerte, 
  CajaFuerteTransaction, 
  CajaFuerteTransactionParams,
  AddMoneyRequest,
  WithdrawMoneyRequest,
  DailySummary,
  TodayStatus,
  CloseDayRequest
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

/**
 * Obtiene el resumen diario de CajaFuerte
 */
export async function getDailySummary(from: string, to: string): Promise<DailySummary[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('from', from);
  queryParams.append('to', to);
  
  return get<DailySummary[]>(`/cajafuerte/daily-summary?${queryParams.toString()}`);
}

/**
 * Cierra un día manualmente
 */
export async function closeDay(request: CloseDayRequest): Promise<void> {
  return post<void>('/cajafuerte/close-day', request);
}

/**
 * Reabre un día cerrado
 */
export async function reopenDay(request: CloseDayRequest): Promise<void> {
  return post<void>('/cajafuerte/reopen-day', request);
}

/**
 * Obtiene el estado de cierre del día actual
 */
export async function getTodayStatus(): Promise<TodayStatus> {
  return get<TodayStatus>('/cajafuerte/today-status');
}
