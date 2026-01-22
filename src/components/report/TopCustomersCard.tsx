import { HiCurrencyEuro, HiCube, HiShoppingCart } from 'react-icons/hi';
import { HiTrophy } from 'react-icons/hi2';
import { formatMoney } from '@/utils/money';
import type { CustomerStats } from '@/types/models';
import './TopCustomersCard.css';

interface TopCustomersCardProps {
  customers: CustomerStats[];
  loading?: boolean;
}

export function TopCustomersCard({ customers, loading }: TopCustomersCardProps) {
  if (loading) {
    return (
      <div className="top-customers-card loading">
        <h3 className="top-customers-card-title">
          <HiTrophy className="top-customers-card-title-icon" />
          Top 3 Compradores
        </h3>
        <div className="top-customers-card-loading">Cargando...</div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="top-customers-card empty">
        <h3 className="top-customers-card-title">
          <HiTrophy className="top-customers-card-title-icon" />
          Top 3 Compradores
        </h3>
        <div className="top-customers-card-empty">No hay datos disponibles</div>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <HiTrophy className="top-customer-rank-icon" style={{ color: '#fbbf24' }} />;
      case 1: return <HiTrophy className="top-customer-rank-icon" style={{ color: '#9ca3af' }} />;
      case 2: return <HiTrophy className="top-customer-rank-icon" style={{ color: '#d97706' }} />;
      default: return `${index + 1}.`;
    }
  };

  return (
    <div className="top-customers-card">
      <h3 className="top-customers-card-title">
        <HiTrophy className="top-customers-card-title-icon" />
        Top 3 Compradores
      </h3>
      <div className="top-customers-list">
        {customers.map((customer, index) => (
          <div key={customer.id} className="top-customer-item">
            <div className="top-customer-rank">{getRankIcon(index)}</div>
            <div className="top-customer-info">
              <div className="top-customer-name">{customer.displayName}</div>
              <div className="top-customer-stats">
                <span className="top-customer-stat">
                  <HiCurrencyEuro className="top-customer-stat-icon" />
                  {formatMoney(customer.totalSpent)}
                </span>
                <span className="top-customer-stat">
                  <HiCube className="top-customer-stat-icon" />
                  {customer.totalGrams.toFixed(2)}g
                </span>
                <span className="top-customer-stat">
                  <HiShoppingCart className="top-customer-stat-icon" />
                  {customer.purchaseCount} compras
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
