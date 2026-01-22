import { useState, useRef, useEffect } from 'react';
import { HiCube, HiCurrencyEuro } from 'react-icons/hi';
import { formatMoney } from '@/utils/money';
import type { SummaryRow } from '@/types/models';
import './HomeTopProductsChart.css';

interface HomeTopProductsChartProps {
  products: SummaryRow[];
  loading?: boolean;
}

export function HomeTopProductsChart({ products, loading }: HomeTopProductsChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null);
  const firstItemRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Calcular altura para mostrar 1.5 elementos (contraído)
  useEffect(() => {
    if (firstItemRef.current && !isExpanded) {
      const itemHeight = firstItemRef.current.offsetHeight;
      const gap = 8; // var(--spacing-sm) aproximado
      const height = itemHeight * 1.5 + gap * 0.5;
      setCollapsedHeight(height);
    }
  }, [products]);

  // Calcular altura total cuando se expande
  useEffect(() => {
    if (isExpanded && listRef.current) {
      // Usar setTimeout para asegurar que el DOM se haya actualizado
      const timer = setTimeout(() => {
        if (listRef.current) {
          const items = listRef.current.children;
          let totalHeight = 0;
          const gap = 8; // var(--spacing-sm) aproximado
          for (let i = 0; i < items.length; i++) {
            totalHeight += (items[i] as HTMLElement).offsetHeight;
            if (i < items.length - 1) {
              totalHeight += gap;
            }
          }
          setExpandedHeight(totalHeight);
        }
      }, 0);
      return () => clearTimeout(timer);
    } else if (!isExpanded) {
      setExpandedHeight(null);
    }
  }, [isExpanded]);

  if (loading) {
    return (
      <div className="home-top-products-chart loading">
        <h3 className="home-top-products-chart-title">
          <HiCube className="home-top-products-chart-title-icon" />
          TopProductos
        </h3>
        <div className="home-top-products-chart-loading">Cargando datos...</div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="home-top-products-chart empty">
        <h3 className="home-top-products-chart-title">
          <HiCube className="home-top-products-chart-title-icon" />
          TopProductos
        </h3>
        <div className="home-top-products-chart-empty">No hay datos disponibles</div>
      </div>
    );
  }

  // Limitar a top 10 y obtener máximo para normalizar las barras
  const topProducts = products.slice(0, 10);
  const maxGrams = Math.max(...topProducts.map(p => p.totalGrams || 0));

  const handleContainerClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className="home-top-products-chart"
      onClick={handleContainerClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="home-top-products-chart-header">
        <h3 className="home-top-products-chart-title">
          <HiCube className="home-top-products-chart-title-icon" />
          TopProductos
        </h3>
        <button
          className="home-top-products-chart-toggle"
          onClick={handleToggleClick}
          aria-label={isExpanded ? 'Contraer lista' : 'Expandir lista'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      <div
        ref={listRef}
        className={`home-top-products-chart-list ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={
          !isExpanded && collapsedHeight
            ? { maxHeight: `${collapsedHeight}px`, overflow: 'hidden' }
            : isExpanded && expandedHeight
            ? { maxHeight: `${expandedHeight}px`, overflow: 'visible' }
            : {}
        }
      >
        {topProducts.map((product, index) => {
          const grams = product.totalGrams || 0;
          const percentage = maxGrams > 0 ? (grams / maxGrams) * 100 : 0;

          return (
            <div
              key={product.key}
              ref={index === 0 ? firstItemRef : null}
              className="home-top-product-item"
              onClick={handleItemClick}
            >
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
                  <HiCube className="home-top-product-stat-icon" />
                  {grams.toFixed(2)}g
                </span>
                {product.totalAmount && (
                  <span className="home-top-product-stat">
                    <HiCurrencyEuro className="home-top-product-stat-icon" />
                    {formatMoney(product.totalAmount)}
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
