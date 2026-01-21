import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { HomeTopProductsChart } from '@/components/home/HomeTopProductsChart';
import { HomeTopCustomersChart } from '@/components/home/HomeTopCustomersChart';
import { getSalesSummary, getMonthlyDashboard } from '@/services/reports.service';
import { getPredefinedPeriod, dateToISO } from '@/utils/dates';
import type { SalesSummaryResponse, MonthlyDashboardResponse } from '@/types/models';
import { useUI } from '@/context/ui.context';
import './HomePage.css';

interface HomeCard {
  path: string;
  title: string;
  description: string;
  icon: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  
  const [topProducts, setTopProducts] = useState<SalesSummaryResponse | null>(null);
  const [dashboard, setDashboard] = useState<MonthlyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Obtener rango del mes actual
        const currentMonth = getPredefinedPeriod('this_month');
        const from = dateToISO(currentMonth.from, false);
        const to = dateToISO(currentMonth.to, true);

        // Cargar datos en paralelo
        // Usar dashboard para obtener topCustomers (CustomerStats[]) ya que getSalesSummary solo soporta 'product'
        const [productsData, dashboardData] = await Promise.all([
          getSalesSummary({ from, to, groupBy: 'product' }),
          getMonthlyDashboard(),
        ]);

        setTopProducts(productsData);
        setDashboard(dashboardData);
      } catch (err: any) {
        showToast(err.message || 'Error al cargar datos del dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  const cards: HomeCard[] = [
    {
      path: '/sales/new',
      title: 'Caja',
      description: 'Dispensar productos y gestionar ventas rápidamente',
      icon: '💰',
    },
    {
      path: '/products',
      title: 'Productos',
      description: 'Gestionar inventario, stock y catálogo de productos',
      icon: '📦',
    },
    {
      path: '/customers',
      title: 'Clientes',
      description: 'Ver, crear y gestionar clientes y suscripciones',
      icon: '👤',
    },
    {
      path: '/reports',
      title: 'Reportes',
      description: 'Ver resúmenes detallados, estadísticas y análisis',
      icon: '📊',
    },
  ];

  // Obtener nombre del mes actual
  const now = new Date();
  const monthName = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <>
      <PageHeader 
        title="Bienvenido" 
        subtitle={`Resumen del mes: ${formattedMonthName}`} 
      />
      
      <div className="home-page">
        {/* Sección de gráficas */}
        <div className="home-charts-section">
          <div className="home-charts-grid">
            <HomeTopProductsChart 
              products={topProducts?.rows || []} 
              loading={loading}
            />
            <HomeTopCustomersChart 
              customers={dashboard?.topCustomers || []} 
              loading={loading}
            />
          </div>
        </div>

        {/* Sección de navegación */}
        <div className="home-navigation-section">
          <h2 className="home-navigation-title">Navegación rápida</h2>
          <div className="home-cards" role="list">
            {cards.map((card) => (
              <div key={card.path} className="home-card-wrapper" role="listitem">
                <button
                  className="home-card"
                  onClick={() => navigate(card.path)}
                  aria-label={`Ir a ${card.title}: ${card.description}`}
                  type="button"
                >
                  <div className="home-card-icon" aria-hidden="true">{card.icon}</div>
                  <h3 className="home-card-title">{card.title}</h3>
                  <p className="home-card-description">{card.description}</p>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
