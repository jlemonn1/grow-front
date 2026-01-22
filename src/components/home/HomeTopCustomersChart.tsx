import { useState, useRef, useEffect } from 'react';
import { HiUsers, HiCurrencyEuro, HiCube, HiShoppingCart } from 'react-icons/hi';
import { HiTrophy } from 'react-icons/hi2';
import { formatMoney } from '@/utils/money';
import type { CustomerStats } from '@/types/models';
import './HomeTopCustomersChart.css';

interface HomeTopCustomersChartProps {
  customers: CustomerStats[];
  loading?: boolean;
}

export function HomeTopCustomersChart({ customers, loading }: HomeTopCustomersChartProps) {
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
  }, [customers]);

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
      <div className="home-top-customers-chart loading">
        <h3 className="home-top-customers-chart-title">
          <HiUsers className="home-top-customers-chart-title-icon" />
          TopClientes
        </h3>
        <div className="home-top-customers-chart-loading">Cargando datos...</div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="home-top-customers-chart empty">
        <h3 className="home-top-customers-chart-title">
          <HiUsers className="home-top-customers-chart-title-icon" />
          TopClientes
        </h3>
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
      case 0: return <HiTrophy className="home-top-customer-rank-icon" style={{ color: '#fbbf24' }} />;
      case 1: return <HiTrophy className="home-top-customer-rank-icon" style={{ color: '#9ca3af' }} />;
      case 2: return <HiTrophy className="home-top-customer-rank-icon" style={{ color: '#d97706' }} />;
      default: return `${index + 1}.`;
    }
  };

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
      className="home-top-customers-chart"
      onClick={handleContainerClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="home-top-customers-chart-header">
        <h3 className="home-top-customers-chart-title">
          <HiUsers className="home-top-customers-chart-title-icon" />
          TopClientes
        </h3>
        <button
          className="home-top-customers-chart-toggle"
          onClick={handleToggleClick}
          aria-label={isExpanded ? 'Contraer lista' : 'Expandir lista'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      <div
        ref={listRef}
        className={`home-top-customers-chart-list ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={
          !isExpanded && collapsedHeight
            ? { maxHeight: `${collapsedHeight}px`, overflow: 'hidden' }
            : isExpanded && expandedHeight
            ? { maxHeight: `${expandedHeight}px`, overflow: 'visible' }
            : {}
        }
      >
        {sortedCustomers.map((customer, index) => {
          const spent = customer.totalSpent || 0;
          const percentage = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;

          return (
            <div
              key={customer.id}
              ref={index === 0 ? firstItemRef : null}
              className="home-top-customer-item"
              onClick={handleItemClick}
            >
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
                  <HiCurrencyEuro className="home-top-customer-stat-icon" />
                  {formatMoney(spent)}
                </span>
                <span className="home-top-customer-stat">
                  <HiCube className="home-top-customer-stat-icon" />
                  {customer.totalGrams.toFixed(2)}g
                </span>
                {customer.purchaseCount > 0 && (
                  <span className="home-top-customer-stat">
                    <HiShoppingCart className="home-top-customer-stat-icon" />
                    {customer.purchaseCount} compras
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
