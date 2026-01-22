import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import type { HourlyStockResponse } from '@/types/models';
import './HourlyStockChart.css';

interface HourlyStockChartProps {
  data: HourlyStockResponse | null;
  loading?: boolean;
}

function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return '#3bd420';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#3bd420';
}

export function HourlyStockChart({ data, loading }: HourlyStockChartProps) {
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
      <ChartContainer title="Movimientos de Stock por Hora">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          Cargando...
        </div>
      </ChartContainer>
    );
  }

  const chartData = data.dataPoints.map(point => ({
    hora: point.label,
    recargas: point.recharges,
    ventas: point.salesOut,
    movimientos: point.totalMovements,
  }));

  const gridColor = borderColor + '4d';
  const rechargeColor = '#3bd420';
  const salesOutColor = '#ff6b6b';

  return (
    <ChartContainer title="Movimientos de Stock por Hora del Día">
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
            stroke={borderColor}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke={borderColor}
          />
          <Tooltip 
            formatter={(value: number | undefined, name: string) => {
              if (name === 'recargas' || name === 'ventas') {
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
            dataKey="recargas" 
            fill={rechargeColor}
            name="Recargas (g)"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="left"
            dataKey="ventas" 
            fill={salesOutColor}
            name="Salidas por Venta (g)"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="movimientos" 
            fill={neonPrimary + '80'}
            name="Cantidad de Movimientos"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
