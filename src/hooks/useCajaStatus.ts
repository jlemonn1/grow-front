import { useState, useEffect, useCallback } from 'react';
import { cajaService } from '@/services/caja/caja.service';

interface UseCajaStatusReturn {
  isTodayClosed: boolean;
  hasCajaAbierta: boolean;
  loading: boolean;
  refreshStatus: () => Promise<void>;
}

export function useCajaStatus(): UseCajaStatusReturn {
  const [hasCajaAbierta, setHasCajaAbierta] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const caja = await cajaService.getCajaActual();
      setHasCajaAbierta(caja !== null && caja.estado === 'ABIERTA');
    } catch (error) {
      console.error('Error al obtener estado de la caja:', error);
      setHasCajaAbierta(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Para compatibilidad con código existente:
  // isTodayClosed = true significa que NO hay caja abierta (bloquear ventas)
  const isTodayClosed = !hasCajaAbierta;

  return {
    isTodayClosed,
    hasCajaAbierta,
    loading,
    refreshStatus,
  };
}
