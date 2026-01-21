import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { getSalesSummary, getStockSummary } from '@/services/reports.service';
import type { 
  SalesSummaryResponse, 
  StockSummaryResponse, 
  SalesSummaryParams, 
  StockSummaryParams 
} from '@/types/models';
import type { DateRange } from '@/components/common/DateRangePicker';
import { dateToISO, getPreviousPeriod } from '@/utils/dates';
import { debounce } from '@/utils/debounce';
import { areParamsEqual, validateDateRange } from '@/utils/params';

interface ReportsContextValue {
  salesSummary: SalesSummaryResponse | null;
  stockSummary: StockSummaryResponse | null;
  comparisonSalesSummary: SalesSummaryResponse | null;
  comparisonStockSummary: StockSummaryResponse | null;
  loading: boolean;
  isLoadingSales: boolean;
  isLoadingStock: boolean;
  error: string | null;
  dateRange: DateRange | null;
  comparisonDateRange: DateRange | null;
  salesGroupBy: 'day' | 'product' | 'category' | 'customer';
  stockGroupBy: 'product' | 'category';
  loadSalesSummary: (params?: SalesSummaryParams) => Promise<void>;
  loadStockSummary: (params?: StockSummaryParams) => Promise<void>;
  setDateRange: (range: DateRange | null) => void;
  setComparisonDateRange: (range: DateRange | null) => void;
  setSalesGroupBy: (groupBy: 'day' | 'product' | 'category' | 'customer') => void;
  setStockGroupBy: (groupBy: 'product' | 'category') => void;
  refreshAll: () => Promise<void>;
  isInitialLoad: boolean;
  enableComparison: boolean;
  setEnableComparison: (enable: boolean) => void;
}

const ReportsContext = createContext<ReportsContextValue | undefined>(undefined);

interface ReportsProviderProps {
  children: ReactNode;
}

interface CacheEntry<T> {
  data: T;
  params: SalesSummaryParams | StockSummaryParams;
  timestamp: number;
}

const CACHE_DURATION = 60000; // 1 minuto

export function ReportsProvider({ children }: ReportsProviderProps) {
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [stockSummary, setStockSummary] = useState<StockSummaryResponse | null>(null);
  const [comparisonSalesSummary, setComparisonSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [comparisonStockSummary, setComparisonStockSummary] = useState<StockSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRangeState] = useState<DateRange | null>(null);
  const [comparisonDateRange, setComparisonDateRangeState] = useState<DateRange | null>(null);
  const [salesGroupBy, setSalesGroupByState] = useState<'day' | 'product' | 'category' | 'customer'>('product');
  const [stockGroupBy, setStockGroupByState] = useState<'product' | 'category'>('product');
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [enableComparison, setEnableComparison] = useState<boolean>(false);

  // Caché para evitar recargas innecesarias
  const salesCacheRef = useRef<CacheEntry<SalesSummaryResponse> | null>(null);
  const stockCacheRef = useRef<CacheEntry<StockSummaryResponse> | null>(null);
  const lastSalesParamsRef = useRef<SalesSummaryParams | null>(null);
  const lastStockParamsRef = useRef<StockSummaryParams | null>(null);

  // Validar y obtener parámetros de ventas
  const getSalesParams = useCallback((): SalesSummaryParams => {
    const params: SalesSummaryParams = {
      groupBy: salesGroupBy,
    };

    if (dateRange) {
      const validation = validateDateRange(dateRange.from, dateRange.to);
      if (!validation.valid) {
        throw new Error(validation.error || 'Rango de fechas inválido');
      }
      params.from = dateToISO(dateRange.from, false);
      params.to = dateToISO(dateRange.to, true);
    }

    return params;
  }, [dateRange, salesGroupBy]);

  // Validar y obtener parámetros de stock
  const getStockParams = useCallback((): StockSummaryParams => {
    const params: StockSummaryParams = {
      groupBy: stockGroupBy,
    };

    if (dateRange) {
      const validation = validateDateRange(dateRange.from, dateRange.to);
      if (!validation.valid) {
        throw new Error(validation.error || 'Rango de fechas inválido');
      }
      params.from = dateToISO(dateRange.from, false);
      params.to = dateToISO(dateRange.to, true);
    }

    return params;
  }, [dateRange, stockGroupBy]);

  const loadSalesSummary = useCallback(async (params?: SalesSummaryParams) => {
    const requestParams = params || getSalesParams();

    // Verificar caché
    const cache = salesCacheRef.current;
    if (cache && areParamsEqual(cache.params, requestParams)) {
      const cacheAge = Date.now() - cache.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setSalesSummary(cache.data);
        return;
      }
    }

    // Verificar si los parámetros realmente cambiaron
    if (areParamsEqual(lastSalesParamsRef.current, requestParams)) {
      return; // No hacer nada si los parámetros son iguales
    }

    lastSalesParamsRef.current = requestParams;
    setIsLoadingSales(true);
    setError(null);

    try {
      const response = await getSalesSummary(requestParams);
      setSalesSummary(response);
      salesCacheRef.current = {
        data: response,
        params: requestParams,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      setError(err.message || 'Error al cargar resumen de ventas');
      setSalesSummary(null);
      throw err;
    } finally {
      setIsLoadingSales(false);
    }
  }, [getSalesParams]);

  const loadStockSummary = useCallback(async (params?: StockSummaryParams) => {
    const requestParams = params || getStockParams();

    // Verificar caché
    const cache = stockCacheRef.current;
    if (cache && areParamsEqual(cache.params, requestParams)) {
      const cacheAge = Date.now() - cache.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setStockSummary(cache.data);
        return;
      }
    }

    // Verificar si los parámetros realmente cambiaron
    if (areParamsEqual(lastStockParamsRef.current, requestParams)) {
      return; // No hacer nada si los parámetros son iguales
    }

    lastStockParamsRef.current = requestParams;
    setIsLoadingStock(true);
    setError(null);

    try {
      const response = await getStockSummary(requestParams);
      setStockSummary(response);
      stockCacheRef.current = {
        data: response,
        params: requestParams,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      setError(err.message || 'Error al cargar resumen de stock');
      setStockSummary(null);
      throw err;
    } finally {
      setIsLoadingStock(false);
    }
  }, [getStockParams]);

  // Actualizar loading general cuando cambien los estados individuales
  useEffect(() => {
    setLoading(isLoadingSales || isLoadingStock);
  }, [isLoadingSales, isLoadingStock]);

  const setDateRange = useCallback((range: DateRange | null) => {
    setDateRangeState(range);
    // Si la comparación está habilitada y no hay rango de comparación, calcular automáticamente
    if (enableComparison && range && !comparisonDateRange) {
      const previousRange = getPreviousPeriod(range);
      setComparisonDateRangeState(previousRange);
    }
  }, [enableComparison, comparisonDateRange]);

  const setComparisonDateRange = useCallback((range: DateRange | null) => {
    setComparisonDateRangeState(range);
  }, []);

  const setSalesGroupBy = useCallback((groupBy: 'day' | 'product' | 'category' | 'customer') => {
    setSalesGroupByState(groupBy);
  }, []);

  const setStockGroupBy = useCallback((groupBy: 'product' | 'category') => {
    setStockGroupByState(groupBy);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsInitialLoad(false);
    
    try {
      const salesParams = getSalesParams();
      const stockParams = getStockParams();

      // Invalidar caché para forzar recarga
      lastSalesParamsRef.current = null;
      lastStockParamsRef.current = null;

      // Cargar datos principales
      const [salesResponse, stockResponse] = await Promise.all([
        getSalesSummary(salesParams),
        getStockSummary(stockParams),
      ]);

      setSalesSummary(salesResponse);
      setStockSummary(stockResponse);

      // Actualizar caché
      salesCacheRef.current = {
        data: salesResponse,
        params: salesParams,
        timestamp: Date.now(),
      };
      stockCacheRef.current = {
        data: stockResponse,
        params: stockParams,
        timestamp: Date.now(),
      };

      lastSalesParamsRef.current = salesParams;
      lastStockParamsRef.current = stockParams;

      // Si la comparación está habilitada, cargar datos de comparación
      if (enableComparison && comparisonDateRange) {
        const comparisonSalesParams: SalesSummaryParams = {
          groupBy: salesGroupBy,
          from: dateToISO(comparisonDateRange.from, false),
          to: dateToISO(comparisonDateRange.to, true),
        };

        const comparisonStockParams: StockSummaryParams = {
          groupBy: stockGroupBy,
          from: dateToISO(comparisonDateRange.from, false),
          to: dateToISO(comparisonDateRange.to, true),
        };

        const [comparisonSalesResponse, comparisonStockResponse] = await Promise.all([
          getSalesSummary(comparisonSalesParams),
          getStockSummary(comparisonStockParams),
        ]);

        setComparisonSalesSummary(comparisonSalesResponse);
        setComparisonStockSummary(comparisonStockResponse);
      } else {
        setComparisonSalesSummary(null);
        setComparisonStockSummary(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
      setIsLoadingSales(false);
      setIsLoadingStock(false);
    }
  }, [getSalesParams, getStockParams, enableComparison, comparisonDateRange, salesGroupBy, stockGroupBy]);

  // Debounced refresh para cambios automáticos de filtros
  const debouncedRefreshRef = useRef(
    debounce(() => {
      refreshAll().catch(() => {
        // El error ya se maneja en refreshAll
      });
    }, 500)
  );

  // Auto-refresh cuando cambian los filtros (con debounce)
  useEffect(() => {
    if (!isInitialLoad) {
      debouncedRefreshRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, salesGroupBy, stockGroupBy, enableComparison, comparisonDateRange]);

  const value: ReportsContextValue = {
    salesSummary,
    stockSummary,
    comparisonSalesSummary,
    comparisonStockSummary,
    loading,
    isLoadingSales,
    isLoadingStock,
    error,
    dateRange,
    comparisonDateRange,
    salesGroupBy,
    stockGroupBy,
    loadSalesSummary,
    loadStockSummary,
    setDateRange,
    setComparisonDateRange,
    setSalesGroupBy,
    setStockGroupBy,
    refreshAll,
    isInitialLoad,
    enableComparison,
    setEnableComparison,
  };

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports debe ser usado dentro de ReportsProvider');
  }
  return context;
}
