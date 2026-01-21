import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer } from './ChartContainer';
import { formatMoney } from '@/utils/money';
import type { SalesTrendResponse } from '@/types/models';

interface TrendChartProps {
  data: SalesTrendResponse | null;
  loading?: boolean;
  comparisonData?: SalesTrendResponse | null;
}

function getCSSVariable(variable: string): string {
  if (typeof window === 'undefined') return '#3bd420';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#3bd420';
}

export function TrendChart({ data, loading, comparisonData }: TrendChartProps) {
  const [neonPrimary, setNeonPrimary] = useState('#3bd420');
  const [borderColor, setBorderColor] = useState('#e2e8f0');

  useEffect(() => {
    setNeonPrimary(getCSSVariable('--neon-primary'));
    setBorderColor(getCSSVariable('--border-color'));
    
    // Escuchar cambios en las variables CSS
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
      <ChartContainer title="Tendencias de Ventas">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          Cargando...
        </div>
      </ChartContainer>
    );
  }

  // Preparar datos para la gráfica
  const chartData = data.dataPoints.map(point => ({
    label: point.label,
    actual: point.totalAmount,
    comparison: comparisonData?.dataPoints.find(p => p.label === point.label)?.totalAmount || null,
  }));

  // Generar color complementario para la línea de comparación
  const getComplementaryColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;
  };
  
  const comparisonColor = comparisonData ? getComplementaryColor(neonPrimary) : '#82ca9d';
  const gridColor = borderColor + '4d'; // 30% opacity

  return (
    <ChartContainer title="Tendencias de Ventas">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <XAxis 
            dataKey="label" 
            angle={-45}
            textAnchor="end"
            height={80}
            stroke={borderColor}
          />
          <YAxis 
            tickFormatter={(value) => formatMoney(value)}
            stroke={borderColor}
          />
          <Tooltip 
            formatter={(value: number) => formatMoney(value)}
            contentStyle={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-led-color)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-neon-sm)',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke={neonPrimary} 
            name="Período Actual"
            strokeWidth={3}
            dot={{ fill: neonPrimary, r: 4 }}
            activeDot={{ r: 6 }}
          />
          {comparisonData && (
            <Line 
              type="monotone" 
              dataKey="comparison" 
              stroke={comparisonColor} 
              name="Período Comparación"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: comparisonColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
