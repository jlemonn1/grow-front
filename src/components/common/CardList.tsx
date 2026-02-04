import { useState, ReactNode } from 'react';
import { DataTable, type ColumnDef } from './DataTable';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from './EmptyState';
import './CardList.css';

interface PaginationInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

interface CardListProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
  renderCard: (item: T, isExpanded: boolean, onToggleExpand: () => void) => ReactNode;
  getRowDataTour?: (row: T) => string;
}

export function CardList<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  onDelete: _onDelete,
  emptyMessage = 'No hay datos disponibles',
  renderCard,
  getRowDataTour,
}: CardListProps<T>) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const handleToggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <>
      {/* Vista de tabla para desktop */}
      <div className="card-list-table-view">
        <DataTable
          columns={columns}
          data={data}
          loading={false}
          pagination={pagination}
          onPageChange={onPageChange}
          onRowClick={onRowClick}
          emptyMessage={emptyMessage}
          getRowDataTour={getRowDataTour}
        />
      </div>

      {/* Vista de cards para móvil */}
      <div className="card-list-cards-view">
        <div className="card-list-cards-container">
          {data.map((item, index) => (
            <div key={item.key || item.id || index}>
              {renderCard(
                item, 
                expandedIndices.has(index), 
                () => handleToggleExpand(index)
              )}
            </div>
          ))}
        </div>
        
        {pagination && pagination.totalPages > 1 && (
          <div className="card-list-pagination">
            <button
              className="card-list-pagination-button"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 0}
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <span className="card-list-pagination-info">
              Página {pagination.page + 1} de {pagination.totalPages} ({pagination.total} total)
            </span>
            <button
              className="card-list-pagination-button"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </>
  );
}
