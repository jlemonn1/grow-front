import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCurrencyEuro, HiCube, HiUser, HiChartBar } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { HomeTopProductsChart } from '@/components/home/HomeTopProductsChart';
import { HomeTopCustomersChart } from '@/components/home/HomeTopCustomersChart';
import { GlobalSearchInput } from '@/components/home/GlobalSearchInput';
import { GlobalSearchModal } from '@/components/home/GlobalSearchModal';
import { getSalesSummary, getMonthlyDashboard } from '@/services/reports.service';
import { getPredefinedPeriod, dateToISO } from '@/utils/dates';
import { useDemo } from '@/context/demo.context';
import type { SalesSummaryResponse, MonthlyDashboardResponse } from '@/types/models';
import { useUI } from '@/context/ui.context';
import './HomePage.css';

interface HomeCard {
  path: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { isDemoMode, demoData } = useDemo();
  
  const [topProducts, setTopProducts] = useState<SalesSummaryResponse | null>(null);
  const [dashboard, setDashboard] = useState<MonthlyDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Si estamos en modo demo, generar datos mock
        if (isDemoMode && demoData) {
          // Generar resumen de productos mock
          const productMap = new Map<string, { name: string; totalAmount: number }>();
          demoData.sales.forEach(sale => {
            sale.items.forEach(item => {
              const existing = productMap.get(item.productId) || { name: item.productName, totalAmount: 0 };
              productMap.set(item.productId, {
                name: item.productName,
                totalAmount: existing.totalAmount + item.lineTotal,
              });
            });
          });

          const productRows = Array.from(productMap.entries())
            .map(([key, value]) => ({
              key,
              label: value.name,
              totalAmount: value.totalAmount,
            }))
            .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));

          const currentMonth = getPredefinedPeriod('this_month');
          const productsData: SalesSummaryResponse = {
            period: {
              from: dateToISO(currentMonth.from, false),
              to: dateToISO(currentMonth.to, true),
            },
            groupBy: 'product',
            totalAmount: productRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0),
            rows: productRows,
          };

          // Generar dashboard mock
          const customerMap = new Map<string, { displayName: string; totalSpent: number; totalGrams: number; purchaseCount: number }>();
          demoData.sales.forEach(sale => {
            const customer = demoData.customers.find(c => c.id === sale.customerId);
            if (customer) {
              const existing = customerMap.get(customer.id) || {
                displayName: customer.displayName,
                totalSpent: 0,
                totalGrams: 0,
                purchaseCount: 0,
              };
              customerMap.set(customer.id, {
                displayName: customer.displayName,
                totalSpent: existing.totalSpent + sale.totalAmount,
                totalGrams: existing.totalGrams + sale.items.reduce((sum, item) => sum + item.grams, 0),
                purchaseCount: existing.purchaseCount + 1,
              });
            }
          });

          const topCustomers = Array.from(customerMap.values())
            .map(customer => ({
              id: demoData.customers.find(c => c.displayName === customer.displayName)?.id || '',
              displayName: customer.displayName,
              totalSpent: customer.totalSpent,
              totalGrams: customer.totalGrams,
              purchaseCount: customer.purchaseCount,
              avgTicket: customer.totalSpent / customer.purchaseCount,
            }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);

          const dashboardData: MonthlyDashboardResponse = {
            period: {
              from: dateToISO(currentMonth.from, false),
              to: dateToISO(currentMonth.to, true),
            },
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            topProduct: productRows.length > 0 ? {
              id: productRows[0].key,
              name: productRows[0].label,
              totalGrams: 0,
              totalRevenue: productRows[0].totalAmount || 0,
            } : null,
            mostProfitableProduct: productRows.length > 0 ? {
              id: productRows[0].key,
              name: productRows[0].label,
              totalGrams: 0,
              totalRevenue: productRows[0].totalAmount || 0,
            } : null,
            topCustomers,
            fumonDelMes: topCustomers.length > 0 ? {
              id: topCustomers[0].id,
              displayName: topCustomers[0].displayName,
              totalSpent: topCustomers[0].totalSpent,
              totalGrams: topCustomers[0].totalGrams,
              purchaseCount: topCustomers[0].purchaseCount,
              loyaltyScore: 100,
              reason: 'Mayor gasto del mes',
            } : null,
          };

          setTopProducts(productsData);
          setDashboard(dashboardData);
        } else {
          // Modo normal: llamar a la API
          const currentMonth = getPredefinedPeriod('this_month');
          const from = dateToISO(currentMonth.from, false);
          const to = dateToISO(currentMonth.to, true);

          // Cargar datos en paralelo
          const [productsData, dashboardData] = await Promise.all([
            getSalesSummary({ from, to, groupBy: 'product' }),
            getMonthlyDashboard(),
          ]);

          setTopProducts(productsData);
          setDashboard(dashboardData);
        }
      } catch (err: any) {
        showToast(err.message || 'Error al cargar datos del dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast, isDemoMode, demoData]);

  const cards: HomeCard[] = [
    {
      path: '/sales/new',
      title: 'Dispensar',
      description: 'Dispensar productos y gestionar dispensaciones rápidamente',
      icon: <HiCurrencyEuro />,
    },
    {
      path: '/products',
      title: 'Productos',
      description: 'Gestionar inventario, stock y catálogo de productos',
      icon: <HiCube />,
    },
    {
      path: '/customers',
      title: 'Socios',
      description: 'Ver, crear y gestionar socios y suscripciones',
      icon: <HiUser />,
    },
    {
      path: '/reports',
      title: 'Reportes',
      description: 'Ver resúmenes detallados, estadísticas y análisis',
      icon: <HiChartBar />,
    },
  ];

  // Obtener nombre del mes actual
  const now = new Date();
  const monthName = now.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <>
      <GlobalSearchInput onOpenModal={() => setIsSearchModalOpen(true)} />
      
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

      <GlobalSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </>
  );
}
