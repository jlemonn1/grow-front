import { useState, useEffect, useCallback } from 'react';
import { DataTable, type ColumnDef } from '@/components/common/DataTable';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { customersService } from '@/services/customers.service';
import type { BalanceTransaction } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './BalanceHistoryTable.css';

interface BalanceHistoryTableProps {
  customerId: string;
}

const getTransactionTypeLabel = (type: BalanceTransaction['type']): string => {
  switch (type) {
    case 'SALE_USED':
      return 'Usado en venta';
    case 'MANUAL_ADJUSTMENT':
      return 'Ajuste manual';
    case 'CHANGE_SAVED':
      return 'Cambio guardado';
    case 'TRANSFER_OUT':
      return 'Transferencia saliente';
    case 'TRANSFER_IN':
      return 'Transferencia entrante';
    default:
      return type;
  }
};

export function BalanceHistoryTable({ customerId }: BalanceHistoryTableProps) {
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  const loadHistory = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const response = await customersService.getBalanceHistory(customerId, page, 25);
      setTransactions(response.content);
      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (error) {
      console.error('Error al cargar historial de saldo:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadHistory(0);
  }, [loadHistory]);

  const handlePageChange = useCallback((page: number) => {
    loadHistory(page);
  }, [loadHistory]);

  const columns: ColumnDef<BalanceTransaction>[] = [
    {
      header: 'Fecha',
      accessor: 'createdAt',
      cell: (value) => value ? formatDateTime(value) : '-',
    },
    {
      header: 'Tipo',
      accessor: 'type',
      cell: (value) => getTransactionTypeLabel(value as BalanceTransaction['type']),
    },
    {
      header: 'Monto',
      accessor: 'amount',
      cell: (value) => {
        const amount = value as number;
        return (
          <span className={amount >= 0 ? 'balance-positive' : 'balance-negative'}>
            {amount >= 0 ? '+' : ''}{formatMoney(amount)}
          </span>
        );
      },
    },
    {
      header: 'Saldo resultante',
      accessor: 'resultingBalance',
      cell: (value) => formatMoney(value as number),
    },
    {
      header: 'Notas',
      accessor: 'notes',
      cell: (value) => value || '-',
    },
    {
      header: 'Realizado por',
      accessor: 'createdByUsername',
      cell: (value) => value || '-',
    },
  ];

  if (loading && transactions.length === 0) {
    return (
      <div className="balance-history-loading">
        <Spinner />
      </div>
    );
  }

  if (!loading && transactions.length === 0) {
    return (
      <EmptyState
        message="No hay transacciones de saldo registradas"
        icon="💰"
      />
    );
  }

  return (
    <div className="balance-history-table">
      <DataTable
        columns={columns}
        data={transactions}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
