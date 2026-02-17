import { useMemo } from 'react';
import { ChartContainer } from './ChartContainer';
import { formatMoney } from '@/utils/money';
import type { HourlySalesResponse } from '@/types/models';
import './PeakHoursCard.css';

interface PeakHoursCardProps {
  data: HourlySalesResponse | null;
  loading?: boolean;
}

export function PeakHoursCard({ data, loading }: PeakHoursCardProps) {
  const peakHours = useMemo(() => {
    if (!data || !data.dataPoints) {
      return null;
    }

    // Encontrar la hora con mayor monto total
    const maxAmount = data.dataPoints.reduce((max, point) => 
      point.totalAmount > max.totalAmount ? point : max
    );

    // Encontrar la hora con mayor cantidad de ventas
    const maxSales = data.dataPoints.reduce((max, point) => 
      point.saleCount > max.saleCount ? point : max
    );

    // Encontrar la hora con mayor cantidad de gramos
    const maxGrams = data.dataPoints.reduce((max, point) => 
      point.totalGrams > max.totalGrams ? point : max
    );

    // Encontrar top 3 horas por monto
    const topByAmount = [...data.dataPoints]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3);

    return {
      maxAmount,
      maxSales,
      maxGrams,
      topByAmount,
    };
  }, [data]);

  if (loading || !data || !peakHours) {
    return (
      <ChartContainer title="Horas Pico">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          Cargando...
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="Horas Pico de Actividad">
      <div className="peak-hours-card">
        <div className="peak-hours-grid">
          <div className="peak-hour-item highlight">
            <div className="peak-hour-item-label">Mayor Monto</div>
            <div className="peak-hour-item-value">{peakHours.maxAmount.label}</div>
            <div className="peak-hour-item-amount">{formatMoney(peakHours.maxAmount.totalAmount)}</div>
            <div className="peak-hour-item-detail">{peakHours.maxAmount.saleCount} ventas</div>
          </div>

          <div className="peak-hour-item">
            <div className="peak-hour-item-label">Más Ventas</div>
            <div className="peak-hour-item-value">{peakHours.maxSales.label}</div>
            <div className="peak-hour-item-amount">{peakHours.maxSales.saleCount} ventas</div>
            <div className="peak-hour-item-detail">{formatMoney(peakHours.maxSales.totalAmount)}</div>
          </div>

          <div className="peak-hour-item">
            <div className="peak-hour-item-label">Más Cantidad</div>
            <div className="peak-hour-item-value">{peakHours.maxGrams.label}</div>
            <div className="peak-hour-item-amount">{peakHours.maxGrams.totalGrams.toFixed(2)}</div>
            <div className="peak-hour-item-detail">{peakHours.maxGrams.saleCount} ventas</div>
          </div>
        </div>

        <div className="peak-hours-top3">
          <div className="peak-hours-top3-title">Top 3 Horas por Monto</div>
          <div className="peak-hours-top3-list">
            {peakHours.topByAmount.map((point, index) => (
              <div key={point.hour} className="peak-hours-top3-item">
                <div className="peak-hours-top3-rank">#{index + 1}</div>
                <div className="peak-hours-top3-info">
                  <div className="peak-hours-top3-hour">{point.label}</div>
                  <div className="peak-hours-top3-amount">{formatMoney(point.totalAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
