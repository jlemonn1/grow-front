import { useState, useEffect, useCallback } from 'react';
import { HiCube, HiCurrencyEuro, HiDocumentText } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { MonthSelector } from './MonthSelector';
import { FumonCard } from './FumonCard';
import { TopProductCard } from './TopProductCard';
import { TopCustomersCard } from './TopCustomersCard';
import { HourlySalesChart } from './HourlySalesChart';
import { HourlyStockChart } from './HourlyStockChart';
import { HourlyProductsTable } from './HourlyProductsTable';
import { PeakHoursCard } from './PeakHoursCard';
import { getMonthlyDashboard, downloadAccountBookPdf, getHourlySales, getHourlyStockMovements, getTopProductsByHour } from '@/services/reports.service';
import { useUI } from '@/context/ui.context';
import type { MonthlyDashboardResponse, HourlySalesResponse, HourlyStockResponse, HourlyProductStatsResponse } from '@/types/models';
import './MonthlyDashboard.css';

export function MonthlyDashboard() {
  const { showToast } = useUI();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dashboard, setDashboard] = useState<MonthlyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [hourlySales, setHourlySales] = useState<HourlySalesResponse | null>(null);
  const [hourlyStock, setHourlyStock] = useState<HourlyStockResponse | null>(null);
  const [hourlyProducts, setHourlyProducts] = useState<HourlyProductStatsResponse | null>(null);
  const [loadingHourly, setLoadingHourly] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadingHourly(true);
    try {
      const data = await getMonthlyDashboard(year, month);
      setDashboard(data);

      // Calcular rango de fechas para el mes seleccionado
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0, 23, 59, 59);
      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      // Cargar estadísticas por hora
      const [salesData, stockData, productsData] = await Promise.all([
        getHourlySales(fromISO, toISO),
        getHourlyStockMovements(fromISO, toISO),
        getTopProductsByHour(fromISO, toISO),
      ]);

      setHourlySales(salesData);
      setHourlyStock(stockData);
      setHourlyProducts(productsData);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar dashboard', 'error');
    } finally {
      setLoading(false);
      setLoadingHourly(false);
    }
  }, [year, month, showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleMonthChange = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      const blob = await downloadAccountBookPdf(year, month);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
      a.download = `libro-cuentas-${monthName}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('PDF generado exitosamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al generar PDF', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  }, [year, month, showToast]);

  const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <>
      <PageHeader title="Dashboard Mensual" />
      
      <div className="monthly-dashboard">
        {/* Header con selector de mes y botón PDF */}
        <div className="monthly-dashboard-header">
          <div className="monthly-dashboard-selector">
            <MonthSelector
              year={year}
              month={month}
              onChange={handleMonthChange}
            />
            <div className="monthly-dashboard-period">
              <strong>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</strong>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={handleDownloadPdf}
            loading={generatingPdf}
            disabled={loading}
            icon={<HiDocumentText />}
          >
            Generar Libro de Cuentas PDF
          </Button>
        </div>

        {loading ? (
          <div className="monthly-dashboard-loading">
            Cargando datos del dashboard...
          </div>
        ) : (
          <>
            {/* Fumón del Mes - Card épico */}
            <div className="monthly-dashboard-fumon">
              <FumonCard fumon={dashboard?.fumonDelMes || null} loading={false} />
            </div>

            {/* Top Productos - Grid de 2 columnas */}
            <div className="monthly-dashboard-products">
              <TopProductCard
                product={dashboard?.topProduct || null}
                title="Producto Más Popular"
                icon={<HiCube />}
                highlight="grams"
                loading={false}
              />
              <TopProductCard
                product={dashboard?.mostProfitableProduct || null}
                title="Producto Más Rentable"
                icon={<HiCurrencyEuro />}
                highlight="revenue"
                loading={false}
              />
            </div>

            {/* Top 3 Compradores */}
            <div className="monthly-dashboard-customers">
              <TopCustomersCard
                customers={dashboard?.topCustomers || []}
                loading={false}
              />
            </div>

            {/* Estadísticas por Hora */}
            <div className="monthly-dashboard-hourly">
              <h2 className="monthly-dashboard-section-title">Estadísticas por Hora</h2>
              
              {/* Horas Pico */}
              <div className="monthly-dashboard-peak-hours">
                <PeakHoursCard data={hourlySales} loading={loadingHourly} />
              </div>

              {/* Gráficos de Ventas y Stock por Hora */}
              <div className="monthly-dashboard-hourly-charts">
                <HourlySalesChart data={hourlySales} loading={loadingHourly} />
                <HourlyStockChart data={hourlyStock} loading={loadingHourly} />
              </div>

              {/* Productos por Hora */}
              <div className="monthly-dashboard-hourly-products">
                <HourlyProductsTable data={hourlyProducts} loading={loadingHourly} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
