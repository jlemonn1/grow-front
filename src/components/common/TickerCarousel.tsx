import { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { HiCalendar, HiCurrencyEuro } from 'react-icons/hi';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { getDashboardTicker } from '@/services/reports.service';
import type { DashboardTickerResponse } from '@/types/models';
import './TickerCarousel.css';

export function TickerCarousel() {
  const [data, setData] = useState<DashboardTickerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboardTicker();
        setData(response);
      } catch (err) {
        console.error('Error fetching ticker data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const messages: Array<{ text: string; color: string; icon?: React.ReactNode }> = [];

  if (data) {
    if (data.lowStockProducts?.length > 0) {
      const productsText = data.lowStockProducts
        .map(p => `${p.name} (${p.stockGrams.toFixed(0)}g)`)
        .join(', ');
      messages.push({
        text: `Stock bajo: ${productsText}`,
        color: 'orange',
        icon: <HiExclamationTriangle />
      });
    }

    if (data.expiringSubscriptions?.length > 0) {
      const subscriptionsText = data.expiringSubscriptions
        .map(s => {
          const endDate = new Date(s.subscriptionEndDate);
          const daysUntil = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const dateStr = endDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          const timeStr = daysUntil > 365 ? `${Math.floor(daysUntil / 365)}a` : `${daysUntil}d`;
          return `${s.displayName} (${dateStr}, ${timeStr})`;
        })
        .join(', ');
      messages.push({
        text: `Suscripciones próximas: ${subscriptionsText}`,
        color: 'red',
        icon: <HiCalendar />
      });
    }

    if (data.salesComparison) {
      const { yesterday, today, forecast } = data.salesComparison;
      if (yesterday && today && forecast) {
        messages.push({
          text: `Ventas: Ayer ${yesterday.totalGrams.toFixed(0)}g/€${yesterday.totalAmount.toFixed(0)} | Hoy ${today.totalGrams.toFixed(0)}g/€${today.totalAmount.toFixed(0)} | Prev ${forecast.totalGrams.toFixed(0)}g/€${forecast.totalAmount.toFixed(0)}`,
          color: 'green',
          icon: <HiCurrencyEuro />
        });
      }
    }
  }

  if (loading || !data || messages.length === 0) {
    return null;
  }

  return (
    <div className="ticker-carousel" data-tour="ticker-alerts">
      <Marquee speed={50} pauseOnHover gradient={false}>
        {messages.map((msg, index) => (
          <span key={`${msg.color}-${index}`} className={`ticker-item ticker-${msg.color}`}>
            {msg.icon && <span className="ticker-icon">{msg.icon}</span>}
            {msg.text}
            {index < messages.length - 1 && <span className="ticker-separator">  •  </span>}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
