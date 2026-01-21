import { formatMoney } from '@/utils/money';
import type { ProductStats } from '@/types/models';
import './TopProductCard.css';

interface TopProductCardProps {
  product: ProductStats | null;
  title: string;
  icon: string;
  highlight: 'grams' | 'revenue';
  loading?: boolean;
}

export function TopProductCard({ product, title, icon, highlight, loading }: TopProductCardProps) {
  if (loading) {
    return (
      <div className="top-product-card loading">
        <div className="top-product-card-icon">{icon}</div>
        <div className="top-product-card-content">
          <h3 className="top-product-card-title">{title}</h3>
          <div className="top-product-card-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="top-product-card empty">
        <div className="top-product-card-icon">{icon}</div>
        <div className="top-product-card-content">
          <h3 className="top-product-card-title">{title}</h3>
          <div className="top-product-card-empty">No hay datos disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`top-product-card ${highlight === 'revenue' ? 'highlight-revenue' : 'highlight-grams'}`}>
      <div className="top-product-card-icon">{icon}</div>
      <div className="top-product-card-content">
        <h3 className="top-product-card-title">{title}</h3>
        <div className="top-product-card-name">{product.name}</div>
        <div className="top-product-card-stats">
          <div className="top-product-card-stat">
            <span className="top-product-card-stat-label">Gramos:</span>
            <span className="top-product-card-stat-value">{product.totalGrams.toFixed(2)}g</span>
          </div>
          <div className="top-product-card-stat">
            <span className="top-product-card-stat-label">Ingresos:</span>
            <span className="top-product-card-stat-value">{formatMoney(product.totalRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
