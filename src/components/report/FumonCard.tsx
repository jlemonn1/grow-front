import { formatMoney } from '@/utils/money';
import type { FumonDelMes } from '@/types/models';
import './FumonCard.css';

interface FumonCardProps {
  fumon: FumonDelMes | null;
  loading?: boolean;
}

export function FumonCard({ fumon, loading }: FumonCardProps) {
  if (loading) {
    return (
      <div className="fumon-card loading">
        <div className="fumon-card-crown">👑</div>
        <div className="fumon-card-content">
          <h2 className="fumon-card-title">FUMÓN DEL MES</h2>
          <div className="fumon-card-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!fumon) {
    return (
      <div className="fumon-card empty">
        <div className="fumon-card-crown">👑</div>
        <div className="fumon-card-content">
          <h2 className="fumon-card-title">FUMÓN DEL MES</h2>
          <div className="fumon-card-empty">No hay datos disponibles para este mes</div>
        </div>
      </div>
    );
  }

  const getBadgeClass = (score: number) => {
    if (score > 90) return 'badge-legendary';
    if (score >= 80) return 'badge-epic';
    if (score >= 70) return 'badge-loyal';
    return 'badge-emergent';
  };

  return (
    <div className={`fumon-card ${getBadgeClass(fumon.loyaltyScore)}`}>
      <div className="fumon-card-header">
        <div className="fumon-card-crown">👑</div>
        <div className={`fumon-card-badge ${getBadgeClass(fumon.loyaltyScore)}`}>
          {fumon.loyaltyScore.toFixed(1)} pts
        </div>
      </div>
      <div className="fumon-card-content">
        <h2 className="fumon-card-title">FUMÓN DEL MES</h2>
        <div className="fumon-card-name">{fumon.displayName}</div>
        <div className="fumon-card-reason">{fumon.reason}</div>
        <div className="fumon-card-stats">
          <div className="fumon-card-stat">
            <div className="fumon-card-stat-icon">💰</div>
            <div className="fumon-card-stat-content">
              <div className="fumon-card-stat-label">Total Gastado</div>
              <div className="fumon-card-stat-value">{formatMoney(fumon.totalSpent)}</div>
            </div>
          </div>
          <div className="fumon-card-stat">
            <div className="fumon-card-stat-icon">📦</div>
            <div className="fumon-card-stat-content">
              <div className="fumon-card-stat-label">Gramos Comprados</div>
              <div className="fumon-card-stat-value">{fumon.totalGrams.toFixed(2)}g</div>
            </div>
          </div>
          <div className="fumon-card-stat">
            <div className="fumon-card-stat-icon">🛒</div>
            <div className="fumon-card-stat-content">
              <div className="fumon-card-stat-label">Compras</div>
              <div className="fumon-card-stat-value">{fumon.purchaseCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
