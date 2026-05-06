import { useState, useCallback } from 'react';
import { cajaService } from '@/services/caja/caja.service';
import type { AjusteCajaRequest } from '@/types/caja';

interface UseAjusteCajaReturn {
  ajusteEntrada: (cajaId: string, request: AjusteCajaRequest) => Promise<void>;
  ajusteSalida: (cajaId: string, request: AjusteCajaRequest) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useAjusteCaja(): UseAjusteCajaReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const ajusteEntrada = useCallback(async (
    cajaId: string,
    request: AjusteCajaRequest
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await cajaService.ajusteEntrada(cajaId, request);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Error en ajuste de entrada');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const ajusteSalida = useCallback(async (
    cajaId: string,
    request: AjusteCajaRequest
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await cajaService.ajusteSalida(cajaId, request);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Error en ajuste de salida');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ajusteEntrada,
    ajusteSalida,
    loading,
    error,
  };
}
