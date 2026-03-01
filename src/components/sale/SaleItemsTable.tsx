import { CardList } from '@/components/common/CardList';
import { SaleItemCard } from '@/components/common/SaleItemCard';
import { type ColumnDef } from '@/components/common/DataTable';
import type { SaleItem } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';
import './SaleItemsTable.css';

interface SaleItemsTableProps {
  items: SaleItem[];
}

export function SaleItemsTable({ items }: SaleItemsTableProps) {

  if (items.length === 0) {
    return (
      <div className="sale-items-table-empty">
        <p>No hay items en esta dispensación</p>
      </div>
    );
  }

  const columns: ColumnDef<SaleItem>[] = [
    {
      header: 'Producto',
      accessor: 'productName',
    },
    {
      header: 'Cantidad',
      accessor: 'grams',
      cell: (value: unknown, row: SaleItem) => `${value}${getMeasurementShortLabel(row.measurementType)}`,
    },
    {
      header: 'Precio unitario',
      accessor: 'pricePerGram',
      cell: (_value: unknown, row: SaleItem) => (
        `${formatMoney(row.pricePerGram)}/${getMeasurementShortLabel(row.measurementType)}`
      ),
    },
    {
      header: 'Subtotal',
      accessor: 'lineTotal',
      cell: (value: unknown) => formatMoney(value as number),
    },
  ];

  return (
    <div className="sale-items-table-container">
      <CardList
        columns={columns}
        data={items}
        loading={false}
        emptyMessage="No hay items en esta dispensación"
        renderCard={(item, isExpanded, onToggleExpand) => (
          <SaleItemCard
            item={item}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
        )}
      />
    </div>
  );
}
