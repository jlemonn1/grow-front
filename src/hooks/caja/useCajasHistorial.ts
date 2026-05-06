import { useState, useCallback } from 'react';
import { cajaService } from '@/services/caja/caja.service';
import type { CajaResumen, ListarCajasFilters } from '@/types/caja';

interface UseCajasHistorialReturn {
  cajas: CajaResumen[];
  loading: boolean;
  hasMore: boolean;
  page: number;
  totalPages: number;
  loadMore: () => void;
  fetchCajas: (filters: ListarCajasFilters) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCajasHistorial(): UseCajasHistorialReturn {
  const [cajas, setCajas] = useState<CajaResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<ListarCajasFilters | null>(null);

  const fetchCajas = useCallback(async (filters: ListarCajasFilters) => {
    setLoading(true);
    setCurrentFilters(filters);
    setPage(0);
    try {
      const data = await cajaService.listarCajas(filters);
      setCajas(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Error al cargar cajas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!currentFilters || page >= totalPages - 1 || loading) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const data = await cajaService.listarCajas({
        ...currentFilters,
        page: nextPage,
      });
      setCajas((prev) => [...prev, ...data.content]);
      setPage(nextPage);
    } catch (err: any) {
      console.error('Error al cargar más cajas:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilters, page, totalPages, loading]);

  const refresh = useCallback(async () => {
    if (currentFilters) {
      await fetchCajas(currentFilters);
    }
  }, [currentFilters, fetchCajas]);

  return {
    cajas,
    loading,
    hasMore: page < totalPages - 1,
    page,
    totalPages,
    loadMore,
    fetchCajas,
    refresh,
  };
}
