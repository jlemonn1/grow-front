import { formatMoney } from '@/utils/money';
import type { CustomerStats } from '@/types/models';
import './HomeTopCustomersChart.css';

interface HomeTopCustomersChartProps {
  customers: CustomerStats[];
  loading?: boolean;
}

export function HomeTopCustomersChart({ customers, loading }: HomeTopCustomersChartProps) {
  if (loading) {
    return (
      <div className="home-top-customers-chart loading">
        <h3 className="home-top-customers-chart-title">👥 TopClientes</h3>
        <div className="home-top-customers-chart-loading">Cargando datos...</div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="home-top-customers-chart empty">
        <h3 className="home-top-customers-chart-title">👥 TopClientes</h3>
        <div className="home-top-customers-chart-empty">No hay datos disponibles</div>
      </div>
    );
  }

  // Limitar a top 10 y obtener máximo para normalizar las barras
  // Ordenar por totalSpent (dinero gastado) para mostrar los que más gastan primero
  const sortedCustomers = [...customers]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 10);
  
  const maxSpent = Math.max(...sortedCustomers.map(c => c.totalSpent || 0));

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  return (
    <div className="home-top-customers-chart">
      <h3 className="home-top-customers-chart-title">👥 TopClientes</h3>
      <div className="home-top-customers-chart-list">
        {sortedCustomers.map((customer, index) => {
          const spent = customer.totalSpent || 0;
          const percentage = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;

          return (
            <div key={customer.id} className="home-top-customer-item">
              <div className="home-top-customer-header">
                <span className="home-top-customer-rank">{getRankIcon(index)}</span>
                <span className="home-top-customer-name">{customer.displayName}</span>
              </div>
              <div className="home-top-customer-bar-container">
                <div
                  className="home-top-customer-bar"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={spent}
                  aria-valuemin={0}
                  aria-valuemax={maxSpent}
                />
              </div>
              <div className="home-top-customer-stats">
                <span className="home-top-customer-stat">
                  💰 {formatMoney(spent)}
                </span>
                <span className="home-top-customer-stat">
                  📦 {customer.totalGrams.toFixed(2)}g
                </span>
                {customer.purchaseCount > 0 && (
                  <span className="home-top-customer-stat">
                    🛒 {customer.purchaseCount} compras
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
