import { memo, ReactNode, useCallback } from 'react';
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
                // No activar el click de la fila si se hace click en un botón, enlace o elemento interactivo
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button, a')) {
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
