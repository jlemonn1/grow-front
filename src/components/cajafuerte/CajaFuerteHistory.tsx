import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Select } from '@/components/forms/Select';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { Button } from '@/components/common/Button';
import { CajaFuerteTransactionList } from './CajaFuerteTransactionList';
import { getTransactions } from '@/services/cajafuerte.service';
import type { CajaFuerteTransaction, CajaFuerteTransactionType } from '@/types/models';
import './CajaFuerteHistory.css';

const TRANSACTION_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ADD', label: 'Añadir' },
  { value: 'WITHDRAW', label: 'Retirar' },
  { value: 'CHANGE', label: 'Cambio' },
  { value: 'SALE_INPUT', label: 'Entrada por venta' },
  { value: 'SALE_OUTPUT', label: 'Salida por cambio' },
];

export function CajaFuerteHistory() {
  const [transactions, setTransactions] = useState<CajaFuerteTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });
  const [selectedType, setSelectedType] = useState<CajaFuerteTransactionType | ''>('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const loadHistory = useCallback(async (page: number = 0) => {
    setLoading(true);
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
      console.error('Error al cargar historial de CajaFuerte:', error);
      setTransactions([]);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al cargar el historial de transacciones';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedType, dateRange]);

  useEffect(() => {
    loadHistory(0);
  }, [loadHistory]);

  const handlePageChange = useCallback((page: number) => {
    loadHistory(page);
  }, [loadHistory]);

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
      <div className="cajafuerte-history-filters">
        <div className="cajafuerte-history-filters-row">
          <Select
            id="type-filter"
            label="Tipo de transacción"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as CajaFuerteTransactionType | '')}
            options={TRANSACTION_TYPE_OPTIONS}
          />
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

      {loading && transactions.length === 0 ? (
        <div className="cajafuerte-history-loading">
          <Spinner />
        </div>
      ) : error ? (
        <div className="cajafuerte-history-error">
          <EmptyState
            message={error}
            icon="⚠️"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => loadHistory(0)}
            style={{ marginTop: 'var(--spacing-md)' }}
          >
            Reintentar
          </Button>
        </div>
      ) : !loading && transactions.length === 0 ? (
        <EmptyState
          message="No hay transacciones registradas"
          icon="💰"
        />
      ) : (
        <>
          <CajaFuerteTransactionList transactions={transactions} />
          {renderPagination()}
        </>
      )}
    </div>
  );
}
