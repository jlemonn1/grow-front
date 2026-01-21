import { ReactNode } from 'react';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { CardList } from '@/components/common/CardList';
import { SummaryCard } from '@/components/common/SummaryCard';
import { type ColumnDef } from '@/components/common/DataTable';
import type { SummaryRow } from '@/types/models';
import './SummaryTable.css';

export interface SummaryTableColumn {
  header: string;
  accessor: (row: SummaryRow) => ReactNode;
}

interface SummaryTableProps {
  rows: SummaryRow[];
  columns: SummaryTableColumn[];
  loading?: boolean;
  emptyMessage?: string;
}

export function SummaryTable({ 
  rows, 
  columns, 
  loading = false, 
  emptyMessage = 'No hay datos disponibles' 
}: SummaryTableProps) {
  if (loading) {
    return (
      <div className="summary-table-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  // Convertir SummaryTableColumn a ColumnDef para DataTable
  const dataTableColumns: ColumnDef<SummaryRow>[] = columns.map((col) => ({
    header: col.header,
    accessor: (row: SummaryRow) => col.accessor(row),
  }));

  return (
    <div className="summary-table-container">
      <CardList
        columns={dataTableColumns}
        data={rows}
        loading={false}
        emptyMessage={emptyMessage}
        renderCard={(row) => (
          <SummaryCard
            row={row}
            columns={columns}
          />
        )}
      />
    </div>
  );
}
