import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import type { CustomerSummary } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './CustomerSummaryTable.css';

interface CustomerSummaryTableProps {
  summary: CustomerSummary | null;
  loading?: boolean;
}

export function CustomerSummaryTable({ summary, loading = false }: CustomerSummaryTableProps) {
  if (loading) {
    return (
      <div className="customer-summary-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!summary || summary.items.length === 0) {
    return (
      <EmptyState message="No hay compras registradas para este socio" />
    );
  }

  return (
    <div className="customer-summary-container" data-tour="customer-summary-table">
      <div className="customer-summary-total">
        <span className="customer-summary-total-label">Total gastado:</span>
        <span className="customer-summary-total-amount">{formatMoney(summary.totalSpent)}</span>
      </div>

      <div className="customer-summary-table-container">
        <table className="customer-summary-table">
          <thead>
            <tr>
              <th className="customer-summary-header">Producto</th>
              <th className="customer-summary-header customer-summary-header-right">Gramos totales</th>
              <th className="customer-summary-header customer-summary-header-right">Monto total</th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map((item) => (
              <tr key={item.productId} className="customer-summary-row">
                <td className="customer-summary-cell">{item.productName}</td>
                <td className="customer-summary-cell customer-summary-cell-right">
                  {item.totalGrams.toFixed(2)}g
                </td>
                <td className="customer-summary-cell customer-summary-cell-right">
                  {formatMoney(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
