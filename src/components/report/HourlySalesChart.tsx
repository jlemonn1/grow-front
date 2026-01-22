import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { formatMoney } from '@/utils/money';
import type { HourlySalesResponse } from '@/types/models';
import './HourlySalesChart.css';

interface HourlySalesChartProps {
  data: HourlySalesResponse | null;
  loading?: boolean;
}

function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return '#3bd420';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#3bd420';
}

export function HourlySalesChart({ data, loading }: HourlySalesChartProps) {
  const [neonPrimary, setNeonPrimary] = useState('#3bd420');
  const [borderColor, setBorderColor] = useState('#e2e8f0');

  useEffect(() => {
    setNeonPrimary(getCSSVariable('--neon-primary'));
    setBorderColor(getCSSVariable('--border-color'));
    
    const observer = new MutationObserver(() => {
      setNeonPrimary(getCSSVariable('--neon-primary'));
      setBorderColor(getCSSVariable('--border-color'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    
    return () => observer.disconnect();
  }, []);

  if (loading || !data) {
    return (
      <ChartContainer title="Ventas por Hora">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          Cargando...
        </div>
      </ChartContainer>
    );
  }

  const chartData = data.dataPoints.map(point => ({
    hora: point.label,
    monto: point.totalAmount,
    ventas: point.saleCount,
    gramos: point.totalGrams,
  }));

  const gridColor = borderColor + '4d';

  return (
    <ChartContainer title="Ventas por Hora del Día">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <XAxis 
            dataKey="hora" 
            angle={-45}
            textAnchor="end"
            height={80}
            stroke={borderColor}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={(value) => formatMoney(value)}
            stroke={borderColor}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke={borderColor}
          />
          <Tooltip 
            formatter={(value: number | undefined, name: string) => {
              if (name === 'monto') {
                return value !== undefined ? formatMoney(value) : '';
              }
              if (name === 'gramos') {
                return value !== undefined ? `${value.toFixed(2)} g` : '';
              }
              return value !== undefined ? value.toString() : '';
            }}
            contentStyle={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-led-color)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-neon-sm)',
            }}
          />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="monto" 
            fill={neonPrimary}
            name="Monto Total"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="ventas" 
            fill={neonPrimary + '80'}
            name="Cantidad de Ventas"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
