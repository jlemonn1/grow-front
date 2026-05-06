import { useState, useCallback } from 'react';
import { cajaService } from '@/services/caja/caja.service';
import type {
  PrepararCierreResponse,
  CerrarCajaRequest,
  CerrarCajaResponse,
  CorregirCierreRequest,
  Caja,
} from '@/types/caja';

interface UseCierreCajaReturn {
  prepararCierre: (cajaId: string) => Promise<PrepararCierreResponse>;
  cerrarCaja: (cajaId: string, request: CerrarCajaRequest) => Promise<CerrarCajaResponse>;
  corregirCierre: (cajaId: string, request: CorregirCierreRequest) => Promise<Caja>;
  loading: boolean;
  error: Error | null;
}

export function useCierreCaja(): UseCierreCajaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const prepararCierre = useCallback(async (cajaId: string): Promise<PrepararCierreResponse> => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajaService.prepararCierre(cajaId);
      return data;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Error al preparar cierre');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cerrarCaja = useCallback(async (
    cajaId: string,
    request: CerrarCajaRequest
  ): Promise<CerrarCajaResponse> => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajaService.cerrarCaja(cajaId, request);
      return data;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Error al cerrar caja');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const corregirCierre = useCallback(async (
    cajaId: string,
    request: CorregirCierreRequest
  ): Promise<Caja> => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajaService.corregirCierre(cajaId, request);
      return data;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Error al corregir cierre');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prepararCierre,
    cerrarCaja,
    corregirCierre,
    loading,
    error,
  };
}
