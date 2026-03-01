import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/forms/Select';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { Button } from '@/components/common/Button';
import { CajaFuerteTransactionList } from './CajaFuerteTransactionList';
import { CajaFuerteDailyView } from './CajaFuerteDailyView';
import { getTransactions, getDailySummary, closeDay } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import type { CajaFuerteTransaction, CajaFuerteTransactionType, DailySummary } from '@/types/models';
import { HiCalendar, HiListBullet } from 'react-icons/hi2';
import './CajaFuerteHistory.css';

const TRANSACTION_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ADD', label: 'Añadir' },
  { value: 'WITHDRAW', label: 'Retirar' },
  { value: 'SALE_INPUT', label: 'Entrada por dispensación' },
  { value: 'SALE_OUTPUT', label: 'Salida por cambio' },
];

type ViewMode = 'daily' | 'list';

interface CajaFuerteHistoryProps {
  refreshTrigger?: number;
}

export function CajaFuerteHistory({ refreshTrigger }: CajaFuerteHistoryProps) {
  const { showToast } = useUI();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  const [transactions, setTransactions] = useState<CajaFuerteTransaction[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });
  const [selectedType, setSelectedType] = useState<CajaFuerteTransactionType | ''>('');
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDailyView = useCallback(async () => {
    setDailyLoading(true);
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const from = dateRange?.from || thirtyDaysAgo.toISOString().split('T')[0];
      const to = dateRange?.to || today.toISOString().split('T')[0];
      
      const data = await getDailySummary(from, to);
      setSummaries(data);
      setError(null);
    } catch (error: any) {
      console.error('Error al cargar resumen diario:', error);
      setError(error?.response?.data?.message || 'Error al cargar el resumen diario');
    } finally {
      setDailyLoading(false);
    }
  }, [dateRange]);

  const loadListView = useCallback(async (page: number = 0) => {
    setListLoading(true);
    try {
      const params: Parameters<typeof getTransactions>[0] = {
        page,
        size: 25,
      };

      if (selectedType) {
        params.type = selectedType as CajaFuerteTransactionType;
      }

      if (dateRange) {
        params.from = `${dateRange.from}T00:00:00`;
        params.to = `${dateRange.to}T23:59:59`;
      }

      const response = await getTransactions(params);
      setTransactions(response.content);
      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
      setError(null);
    } catch (error: any) {
      console.error('Error al cargar historial:', error);
      setError(error?.response?.data?.message || 'Error al cargar el historial de transacciones');
    } finally {
      setListLoading(false);
    }
  }, [selectedType, dateRange]);

  useEffect(() => {
    if (viewMode === 'daily') {
      loadDailyView();
    } else {
      loadListView(0);
    }
  }, [viewMode, loadDailyView, loadListView]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      if (viewMode === 'daily') {
        loadDailyView();
      } else {
        loadListView(0);
      }
    }
  }, [refreshTrigger, viewMode, loadDailyView, loadListView]);

  const handleCloseDay = async (date: string) => {
    try {
      await closeDay({ date });
      showToast('Día cerrado exitosamente', 'success');
      loadDailyView();
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Error al cerrar el día', 'error');
    }
  };

  const handlePageChange = useCallback((page: number) => {
    loadListView(page);
  }, [loadListView]);

  const handleClearFilters = () => {
    setSelectedType('');
    setDateRange(null);
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="cajafuerte-history-pagination">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 0}
        >
          Anterior
        </Button>
        <span className="cajafuerte-history-pagination-info">
          Página {pagination.page + 1} de {pagination.totalPages} ({pagination.total} transacciones)
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages - 1}
        >
          Siguiente
        </Button>
      </div>
    );
  };

  return (
    <div className="cajafuerte-history">
      <div className="cajafuerte-history-view-toggle">
        <button
          className={`view-toggle-btn ${viewMode === 'daily' ? 'active' : ''}`}
          onClick={() => setViewMode('daily')}
        >
          <HiCalendar />
          <span>Vista Diaria</span>
        </button>
        <button
          className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          <HiListBullet />
          <span>Vista Lista</span>
        </button>
      </div>

      <div className="cajafuerte-history-filters">
        <div className="cajafuerte-history-filters-row">
          {viewMode === 'list' && (
            <Select
              id="type-filter"
              label="Tipo de transacción"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CajaFuerteTransactionType | '')}
              options={TRANSACTION_TYPE_OPTIONS}
            />
          )}
          <DateRangePicker
            value={dateRange ?? undefined}
            onChange={(range) => setDateRange(range)}
          />
          <div className="cajafuerte-history-filters-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearFilters}
              disabled={!selectedType && !dateRange}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <CajaFuerteDailyView
          summaries={summaries}
          onCloseDay={handleCloseDay}
          loading={dailyLoading}
        />
      ) : (
        <>
          {listLoading && transactions.length === 0 ? (
            <div className="cajafuerte-history-loading">
              <Spinner />
            </div>
          ) : error ? (
            <div className="cajafuerte-history-error">
              <EmptyState message={error} icon="⚠️" />
              <Button
                type="button"
                variant="secondary"
                onClick={() => loadListView(0)}
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                Reintentar
              </Button>
            </div>
          ) : !listLoading && transactions.length === 0 ? (
            <EmptyState message="No hay transacciones registradas" icon="💰" />
          ) : (
            <>
              <CajaFuerteTransactionList transactions={transactions} />
              {renderPagination()}
            </>
          )}
        </>
      )}
    </div>
  );
}
