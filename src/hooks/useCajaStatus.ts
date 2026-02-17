import { useState, useEffect, useCallback } from 'react';
import { getTodayStatus } from '@/services/cajafuerte.service';
import type { TodayStatus } from '@/types/models';

interface UseCajaStatusReturn {
  isTodayClosed: boolean;
  todayStatus: TodayStatus | null;
  loading: boolean;
  refreshStatus: () => Promise<void>;
}

export function useCajaStatus(): UseCajaStatusReturn {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await getTodayStatus();
      setTodayStatus(status);
    } catch (error) {
      console.error('Error al obtener estado de la caja:', error);
      setTodayStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const isTodayClosed = todayStatus?.isClosed ?? false;

  return {
    isTodayClosed,
    todayStatus,
    loading,
    refreshStatus,
  };
}
