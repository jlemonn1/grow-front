import { useState } from 'react';
import { ChartContainer } from './ChartContainer';
import { formatMoney } from '@/utils/money';
import type { HourlyProductStatsResponse } from '@/types/models';
import './HourlyProductsTable.css';

interface HourlyProductsTableProps {
  data: HourlyProductStatsResponse | null;
  loading?: boolean;
}

export function HourlyProductsTable({ data, loading }: HourlyProductsTableProps) {
  const [expandedHours, setExpandedHours] = useState<Set<number>>(new Set());

  const toggleHour = (hour: number) => {
    const newExpanded = new Set(expandedHours);
    if (newExpanded.has(hour)) {
      newExpanded.delete(hour);
    } else {
      newExpanded.add(hour);
    }
    setExpandedHours(newExpanded);
  };

  if (loading || !data) {
    return (
      <ChartContainer title="Productos Más Vendidos por Hora">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          Cargando...
        </div>
      </ChartContainer>
    );
  }

  const hoursWithProducts = data.dataPoints.filter(point => point.products.length > 0);

  if (hoursWithProducts.length === 0) {
    return (
      <ChartContainer title="Productos Más Vendidos por Hora">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          No hay datos disponibles
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="Productos Más Vendidos por Hora del Día">
      <div className="hourly-products-table">
        {hoursWithProducts.map((point) => {
          const isExpanded = expandedHours.has(point.hour);
          return (
            <div key={point.hour} className="hourly-products-hour-section">
              <button
                className="hourly-products-hour-header"
                onClick={() => toggleHour(point.hour)}
                type="button"
              >
                <span className="hourly-products-hour-label">
                  {point.label}
                </span>
                <span className="hourly-products-hour-count">
                  {point.products.length} producto{point.products.length !== 1 ? 's' : ''}
                </span>
                <span className="hourly-products-hour-toggle">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
              {isExpanded && (
                <div className="hourly-products-list">
                  {point.products.map((product, index) => (
                    <div key={product.productId} className="hourly-products-item">
                      <div className="hourly-products-item-rank">#{index + 1}</div>
                      <div className="hourly-products-item-info">
                        <div className="hourly-products-item-name">{product.productName}</div>
                        <div className="hourly-products-item-stats">
                          <span className="hourly-products-item-grams">
                            {product.totalGrams.toFixed(2)} g
                          </span>
                          <span className="hourly-products-item-revenue">
                            {formatMoney(product.totalRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ChartContainer>
  );
}
