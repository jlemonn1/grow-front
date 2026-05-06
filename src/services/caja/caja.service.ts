import { get, post } from '@/services/http';
import { buildApiUrl } from '@/utils/apiUrl';
import type { PageResponse } from '@/types/api';
import type {
  Caja,
  CajaResumen,
  CajaTransaccion,
  PrepararCierreResponse,
  CerrarCajaRequest,
  CerrarCajaResponse,
  CorregirCierreRequest,
  AjusteCajaRequest,
  ExportarCajasRequest,
  ListarCajasFilters,
} from '@/types/caja';

const API_URL = '/cajas';

export const cajaService = {
  // Obtener caja actual (abierta)
  async getCajaActual(): Promise<Caja | null> {
    try {
      return await get<Caja>(`${API_URL}/actual`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Inicializar primera caja
  async inicializarPrimeraCaja(): Promise<Caja> {
    return post<Caja>(`${API_URL}/inicializar`);
  },

  // Preparar cierre de caja
  async prepararCierre(cajaId: string): Promise<PrepararCierreResponse> {
    return get<PrepararCierreResponse>(`${API_URL}/${cajaId}/preparar-cierre`);
  },

  // Cerrar caja
  async cerrarCaja(cajaId: string, request: CerrarCajaRequest): Promise<CerrarCajaResponse> {
    return post<CerrarCajaResponse>(`${API_URL}/${cajaId}/cerrar`, request);
  },

  // Corregir cierre
  async corregirCierre(cajaId: string, request: CorregirCierreRequest): Promise<Caja> {
    return post<Caja>(`${API_URL}/${cajaId}/corregir`, request);
  },

  // Listar cajas (historial)
  async listarCajas(filters: ListarCajasFilters): Promise<PageResponse<CajaResumen>> {
    const params = new URLSearchParams({
      desde: filters.desde,
      hasta: filters.hasta,
      page: String(filters.page || 0),
      size: String(filters.size || 20),
    });
    return get<PageResponse<CajaResumen>>(`${API_URL}?${params}`);
  },

  // Obtener detalle de caja
  async getDetalleCaja(cajaId: string): Promise<Caja> {
    return get<Caja>(`${API_URL}/${cajaId}`);
  },

  // Obtener transacciones de caja
  async getTransacciones(
    cajaId: string,
    page: number = 0,
    size: number = 50
  ): Promise<PageResponse<CajaTransaccion>> {
    return get<PageResponse<CajaTransaccion>>(
      `${API_URL}/${cajaId}/transacciones?page=${page}&size=${size}`
    );
  },

  // Exportar cajas
  async exportarCajas(request: ExportarCajasRequest): Promise<Blob> {
    const url = buildApiUrl(`${API_URL}/exportar`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Error al exportar');
    }

    return response.blob();
  },

  // Ajuste de entrada (añadir dinero)
  async ajusteEntrada(cajaId: string, request: AjusteCajaRequest): Promise<void> {
    return post<void>(`${API_URL}/${cajaId}/ajuste-entrada`, request);
  },

  // Ajuste de salida (retirar dinero)
  async ajusteSalida(cajaId: string, request: AjusteCajaRequest): Promise<void> {
    return post<void>(`${API_URL}/${cajaId}/ajuste-salida`, request);
  },
};
