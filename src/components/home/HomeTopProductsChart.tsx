import { formatMoney } from '@/utils/money';
import type { SummaryRow } from '@/types/models';
import './HomeTopProductsChart.css';

interface HomeTopProductsChartProps {
  products: SummaryRow[];
  loading?: boolean;
}

export function HomeTopProductsChart({ products, loading }: HomeTopProductsChartProps) {
  if (loading) {
    return (
      <div className="home-top-products-chart loading">
        <h3 className="home-top-products-chart-title">📦 TopProductos</h3>
        <div className="home-top-products-chart-loading">Cargando datos...</div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="home-top-products-chart empty">
        <h3 className="home-top-products-chart-title">📦 TopProductos</h3>
        <div className="home-top-products-chart-empty">No hay datos disponibles</div>
      </div>
    );
  }

  // Limitar a top 10 y obtener máximo para normalizar las barras
  const topProducts = products.slice(0, 10);
  const maxGrams = Math.max(...topProducts.map(p => p.totalGrams || 0));

  return (
    <div className="home-top-products-chart">
      <h3 className="home-top-products-chart-title">📦 TopProductos</h3>
      <div className="home-top-products-chart-list">
        {topProducts.map((product, index) => {
          const grams = product.totalGrams || 0;
          const percentage = maxGrams > 0 ? (grams / maxGrams) * 100 : 0;

          return (
            <div key={product.key} className="home-top-product-item">
              <div className="home-top-product-header">
                <span className="home-top-product-rank">{index + 1}</span>
                <span className="home-top-product-name">{product.label}</span>
              </div>
              <div className="home-top-product-bar-container">
                <div
                  className="home-top-product-bar"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={grams}
                  aria-valuemin={0}
                  aria-valuemax={maxGrams}
                />
              </div>
              <div className="home-top-product-stats">
                <span className="home-top-product-stat">
                  📦 {grams.toFixed(2)}g
                </span>
                {product.totalAmount && (
                  <span className="home-top-product-stat">
                    💰 {formatMoney(product.totalAmount)}
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
