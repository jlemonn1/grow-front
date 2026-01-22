import { get } from './http';
import { buildApiUrl } from '@/utils/apiUrl';
import type { 
  SalesSummaryResponse, 
  StockSummaryResponse, 
  SalesSummaryParams, 
  StockSummaryParams,
  SalesTrendResponse,
  SalesTrendParams,
  MonthlyDashboardResponse,
  HourlySalesResponse,
  HourlyStockResponse,
  HourlyProductStatsResponse,
  DashboardTickerResponse
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

  const response = await fetch(buildApiUrl(endpoint), {
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

/**
 * Obtiene estadísticas de ventas agrupadas por hora del día
 */
export async function getHourlySales(
  from?: string,
  to?: string
): Promise<HourlySalesResponse> {
  const queryParams = new URLSearchParams();

  if (from) {
    queryParams.append('from', from);
  }
  if (to) {
    queryParams.append('to', to);
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/sales/hourly${queryString ? `?${queryString}` : ''}`;

  return get<HourlySalesResponse>(endpoint);
}

/**
 * Obtiene estadísticas de movimientos de stock agrupadas por hora del día
 */
export async function getHourlyStockMovements(
  from?: string,
  to?: string
): Promise<HourlyStockResponse> {
  const queryParams = new URLSearchParams();

  if (from) {
    queryParams.append('from', from);
  }
  if (to) {
    queryParams.append('to', to);
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/stock/hourly${queryString ? `?${queryString}` : ''}`;

  return get<HourlyStockResponse>(endpoint);
}

/**
 * Obtiene los productos más vendidos agrupados por hora del día
 */
export async function getTopProductsByHour(
  from?: string,
  to?: string
): Promise<HourlyProductStatsResponse> {
  const queryParams = new URLSearchParams();

  if (from) {
    queryParams.append('from', from);
  }
  if (to) {
    queryParams.append('to', to);
  }

  const queryString = queryParams.toString();
  const endpoint = `/reports/products/hourly${queryString ? `?${queryString}` : ''}`;

  return get<HourlyProductStatsResponse>(endpoint);
}

/**
 * Obtiene los datos del ticker del dashboard
 */
export async function getDashboardTicker(): Promise<DashboardTickerResponse> {
  return get<DashboardTickerResponse>('/reports/dashboard/ticker');
}
