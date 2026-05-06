import { useState, useEffect, useCallback } from 'react';
import { cajaService } from '@/services/caja/caja.service';
import type { Caja } from '@/types/caja';

interface UseCajaActualReturn {
  caja: Caja | null;
  loading: boolean;
  error: Error | null;
  needsInitialization: boolean;
  refetch: () => Promise<void>;
}

export function useCajaActual(): UseCajaActualReturn {
  const [caja, setCaja] = useState<Caja | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [needsInitialization, setNeedsInitialization] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cajaService.getCajaActual();
      setCaja(data);
      setNeedsInitialization(data === null);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    caja,
    loading,
    error,
    needsInitialization,
    refetch,
  };
}
