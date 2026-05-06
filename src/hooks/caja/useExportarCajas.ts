import { useState, useCallback } from 'react';
import { cajaService } from '@/services/caja/caja.service';
import type { ExportarCajasRequest } from '@/types/caja';

interface UseExportarCajasReturn {
  exportar: (request: ExportarCajasRequest, filename?: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useExportarCajas(): UseExportarCajasReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportar = useCallback(async (
    request: ExportarCajasRequest,
    filename?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const blob = await cajaService.exportarCajas(request);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `cajas-report.${request.formato.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Error al exportar');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exportar,
    loading,
    error,
  };
}
