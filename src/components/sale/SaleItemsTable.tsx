import { useState } from 'react';
import { DataTable, type ColumnDef } from '@/components/common/DataTable';
import { CardList } from '@/components/common/CardList';
import { SaleItemCard } from '@/components/common/SaleItemCard';
import type { SaleItem } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './SaleItemsTable.css';

interface SaleItemsTableProps {
  items: SaleItem[];
}

export function SaleItemsTable({ items }: SaleItemsTableProps) {
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

  if (items.length === 0) {
    return (
      <div className="sale-items-table-empty">
        <p>No hay items en esta venta</p>
      </div>
    );
  }

  const columns: ColumnDef<SaleItem>[] = [
    {
      header: 'Producto',
      accessor: 'productName',
    },
    {
      header: 'Gramos',
      accessor: 'grams',
      cell: (value) => `${value}g`,
    },
    {
      header: 'Precio/gramo',
      accessor: 'pricePerGram',
      cell: (value) => formatMoney(value as number),
    },
    {
      header: 'Subtotal',
      accessor: 'lineTotal',
      cell: (value) => formatMoney(value as number),
    },
  ];

  return (
    <div className="sale-items-table-container">
      <CardList
        columns={columns}
        data={items}
        loading={false}
        emptyMessage="No hay items en esta venta"
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
