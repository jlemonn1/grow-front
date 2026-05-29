import { memo, ReactNode, useCallback, useState } from 'react';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from './EmptyState';
import './DataTable.css';

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  cell?: (value: any, row: T) => ReactNode;
}

interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  getRowDataTour?: (row: T) => string;
}

function DataTableComponent<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  getRowDataTour,
}: DataTableProps<T>) {
  const [goToPage, setGoToPage] = useState('');

  const renderCell = useCallback((column: ColumnDef<T>, row: T) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }

    const value = row[column.accessor];
    
    if (column.cell) {
      return column.cell(value, row);
    }

    return value ?? '-';
  }, []);

  const handleGoToPage = useCallback(() => {
    const pageNum = parseInt(goToPage, 10);
    if (
      !isNaN(pageNum) &&
      pageNum >= 1 &&
      pageNum <= (pagination?.totalPages ?? 1) &&
      onPageChange
    ) {
      onPageChange(pageNum - 1);
      setGoToPage('');
    }
  }, [goToPage, pagination?.totalPages, onPageChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  }, [handleGoToPage]);

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="data-table-container" role="region" aria-label="Tabla de datos">
      <table className="data-table" role="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="data-table-header" scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`data-table-row ${onRowClick ? 'data-table-row-clickable' : ''}`}
              role="row"
              data-tour={getRowDataTour ? getRowDataTour(row) : undefined}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const interactive = target.closest('button, a, input, select, textarea');
                if (interactive) {
                  return;
                }
                onRowClick?.(row);
              }}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="data-table-cell" role="cell">
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="data-table-pagination">
          <button
            className="data-table-pagination-button"
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page === 0}
          >
            Anterior
          </button>
          <span className="data-table-pagination-info">
            Página {pagination.page + 1} de {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="data-table-pagination-goto">
            <input
              type="number"
              min={1}
              max={pagination.totalPages}
              placeholder="Pág."
              className="data-table-pagination-goto-input"
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Ir a página"
            />
            <button
              className="data-table-pagination-button"
              onClick={handleGoToPage}
              disabled={!goToPage}
              aria-label="Ir a página"
            >
              Ir
            </button>
          </div>
          <button
            className="data-table-pagination-button"
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export const DataTable = memo(DataTableComponent) as typeof DataTableComponent;
