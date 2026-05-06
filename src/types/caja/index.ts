export type CajaEstado = 'ABIERTA' | 'CERRADA';

export type CajaTransaccionTipo = 
  | 'VENTA'
  | 'CAMBIO'
  | 'SUSCRIPCION_NUEVA'
  | 'SUSCRIPCION_RENOVACION'
  | 'AJUSTE_ENTRADA'
  | 'AJUSTE_SALIDA';

export interface Caja {
  id: string;
  numeroCaja: string;
  fecha: string;
  secuencial: number;
  estado: CajaEstado;
  montoInicial: number;
  montoTeorico: number;
  montoFinalReal?: number;
  montoDejadoSiguiente?: number;
  montoRetirado?: number;
  diferenciaArqueo?: number;
  totalVentas: number;
  totalCambios: number;
  totalSuscripciones: number;
  totalAjustesEntrada: number;
  totalAjustesSalida: number;
  fechaApertura: string;
  fechaCierre?: string;
  puedeCorregirseHasta?: string;
  abiertaPorUsername?: string;
  cerradaPorUsername?: string;
}

export interface CajaResumen {
  id: string;
  numeroCaja: string;
  fecha: string;
  estado: CajaEstado;
  montoInicial: number;
  montoTeorico: number;
  montoFinalReal?: number;
  montoDejadoSiguiente?: number;
  montoRetirado?: number;
  diferenciaArqueo?: number;
  totalVentas: number;
  totalCambios: number;
  totalSuscripciones: number;
  totalAjustesEntrada: number;
  totalAjustesSalida: number;
  fechaApertura: string;
  fechaCierre?: string;
  abiertaPorUsername?: string;
  cerradaPorUsername?: string;
}

export interface CajaTransaccion {
  id: string;
  tipo: CajaTransaccionTipo;
  amount: number;
  descripcion?: string;
  createdAt: string;
  createdByUsername?: string;
  relatedSaleId?: string;
  relatedCustomerId?: string;
}

export interface PrepararCierreResponse {
  caja: Caja;
  montoTeoricoCalculado: number;
  transacciones: CajaTransaccion[];
  advertenciaDiferencia: boolean;
}

export interface CerrarCajaRequest {
  montoFinalReal: number;
  montoDejadoSiguiente: number;
}

export interface CerrarCajaResponse {
  cajaCerrada: Caja;
  nuevaCaja: Caja;
  montoRetirado: number;
  diferenciaArqueo: number;
}

export interface CorregirCierreRequest {
  montoFinalReal: number;
  montoDejadoSiguiente: number;
}

export interface AjusteCajaRequest {
  monto: number;
  notas?: string;
}

export interface ExportarCajasRequest {
  cajaIds: string[];
  incluirTransacciones: boolean;
  formato: 'PDF' | 'EXCEL';
}

export interface ListarCajasFilters {
  desde: string;
  hasta: string;
  page?: number;
  size?: number;
}
