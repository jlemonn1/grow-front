import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { MonthSelector } from './MonthSelector';
import { FumonCard } from './FumonCard';
import { TopProductCard } from './TopProductCard';
import { TopCustomersCard } from './TopCustomersCard';
import { getMonthlyDashboard, downloadAccountBookPdf } from '@/services/reports.service';
import { useUI } from '@/context/ui.context';
import type { MonthlyDashboardResponse } from '@/types/models';
import './MonthlyDashboard.css';

export function MonthlyDashboard() {
  const { showToast } = useUI();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dashboard, setDashboard] = useState<MonthlyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMonthlyDashboard(year, month);
      setDashboard(data);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar dashboard', 'error');
    } finally {
      setLoading(false);
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
          >
            📄 Generar Libro de Cuentas PDF
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
                icon="📦"
                highlight="grams"
                loading={false}
              />
              <TopProductCard
                product={dashboard?.mostProfitableProduct || null}
                title="Producto Más Rentable"
                icon="💰"
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
          </>
        )}
      </div>
    </>
  );
}
