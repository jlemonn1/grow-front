import { get } from './http';
import type { 
  SalesSummaryResponse, 
  StockSummaryResponse, 
  SalesSummaryParams, 
  StockSummaryParams,
  SalesTrendResponse,
  SalesTrendParams,
  MonthlyDashboardResponse
} from '@/types/models';

/**
 * Obtiene el resumen de ventas con filtros opcionales
 */
export async function getSalesSummary(
  params?: SalesSummaryParams
): Promise<SalesSummaryResponse> {
  const queryParams = new URLSearchParams();

  if (params?.from) {
    queryParams.append('from', params.from);
  }
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  if (params?.groupBy) {
    queryParams.append('groupBy', params.groupBy);
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/sales/summary${queryString ? `?${queryString}` : ''}`;

  return get<SalesSummaryResponse>(endpoint);
}

/**
 * Obtiene el resumen de stock incorporado con filtros opcionales
 */
export async function getStockSummary(
  params?: StockSummaryParams
): Promise<StockSummaryResponse> {
  const queryParams = new URLSearchParams();

  if (params?.from) {
    queryParams.append('from', params.from);
  }
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  if (params?.groupBy) {
    queryParams.append('groupBy', params.groupBy);
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/stock/summary${queryString ? `?${queryString}` : ''}`;

  return get<StockSummaryResponse>(endpoint);
}

/**
 * Obtiene las tendencias de ventas con filtros opcionales
 */
export async function getSalesTrends(
  params?: SalesTrendParams
): Promise<SalesTrendResponse> {
  const queryParams = new URLSearchParams();

  if (params?.from) {
    queryParams.append('from', params.from);
  }
  if (params?.to) {
    queryParams.append('to', params.to);
  }
  if (params?.groupBy) {
    queryParams.append('groupBy', params.groupBy);
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/sales/trends${queryString ? `?${queryString}` : ''}`;

  return get<SalesTrendResponse>(endpoint);
}

/**
 * Obtiene el dashboard mensual con todas las métricas
 */
export async function getMonthlyDashboard(
  year?: number,
  month?: number
): Promise<MonthlyDashboardResponse> {
  const queryParams = new URLSearchParams();

  if (year !== undefined) {
    queryParams.append('year', year.toString());
  }
  if (month !== undefined) {
    queryParams.append('month', month.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/dashboard/monthly${queryString ? `?${queryString}` : ''}`;

  return get<MonthlyDashboardResponse>(endpoint);
}

/**
 * Descarga el PDF del libro de cuentas para un mes
 */
export async function downloadAccountBookPdf(
  year?: number,
  month?: number
): Promise<Blob> {
  const queryParams = new URLSearchParams();

  if (year !== undefined) {
    queryParams.append('year', year.toString());
  }
  if (month !== undefined) {
    queryParams.append('month', month.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/account-book/pdf${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(`http://localhost:8080/api/v1${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al generar PDF');
  }

  return response.blob();
}
