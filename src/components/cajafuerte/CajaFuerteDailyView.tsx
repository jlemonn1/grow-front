import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import { formatDate, formatDateTime } from '@/utils/dates';
import type { DailySummary } from '@/types/models';
import { HiChevronDown, HiChevronUp, HiLockClosed, HiClock } from 'react-icons/hi2';
import './CajaFuerteDailyView.css';

function formatWeekday(dateString: string): string {
  const date = new Date(dateString);
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return weekdays[date.getDay()];
}

interface CajaFuerteDailyViewProps {
  summaries: DailySummary[];
  onCloseDay: (date: string) => void;
  loading?: boolean;
}

interface DayCardProps {
  summary: DailySummary;
  onCloseDay: (date: string) => void;
}

function DayCard({ summary, onCloseDay }: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isToday = new Date().toISOString().split('T')[0] === summary.date;
  const isClosed = summary.closedAt !== undefined;

  const netChange = summary.totalAdditions + summary.totalSaleInputs 
    - summary.totalWithdrawals - summary.totalSaleOutputs;

  return (
    <div className={`day-card ${isToday ? 'day-card-today' : ''} ${isClosed ? 'day-card-closed' : 'day-card-open'}`}>
      <div className="day-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="day-card-date">
          <span className="day-card-day">{formatWeekday(summary.date)}</span>
          <span className="day-card-full-date">{formatDate(summary.date)}</span>
          {isToday && <span className="day-card-badge">Hoy</span>}
        </div>
        
        <div className="day-card-balance">
          <div className="day-card-balance-row">
            <span className="day-card-label">Inicio:</span>
            <span className="day-card-amount">{formatMoney(summary.openingBalance)}</span>
          </div>
          <div className="day-card-balance-row">
            <span className="day-card-label">Cierre:</span>
            <span className="day-card-amount day-card-amount-final">
              {formatMoney(summary.closingBalance)}
            </span>
          </div>
          <div className={`day-card-net-change ${netChange >= 0 ? 'positive' : 'negative'}`}>
            {netChange >= 0 ? '+' : ''}{formatMoney(netChange)}
          </div>
        </div>

        <div className="day-card-status">
          {isClosed ? (
            <div className="day-card-status-closed">
              <HiLockClosed className="day-card-icon" />
              <span className="day-card-status-text">
                {summary.isAutoClosed ? 'Auto-cierre' : `Por ${summary.closedByUsername}`}
              </span>
              <span className="day-card-status-time">
                {summary.closedAt ? formatDateTime(summary.closedAt).split(' ')[1] : ''}
              </span>
            </div>
          ) : (
            <div className="day-card-status-open">
              <HiClock className="day-card-icon day-card-icon-pulse" />
              <span className="day-card-status-text">En curso</span>
              {isToday && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDay(summary.date);
                  }}
                >
                  Cerrar caja
                </Button>
              )}
            </div>
          )}
          <button className="day-card-expand-btn">
            {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="day-card-details">
          <div className="day-card-summary">
            <div className="day-card-summary-section">
              <h4 className="day-card-summary-title">Entradas</h4>
              <div className="day-card-summary-row">
                <span>Añadido manual:</span>
                <span className="positive">+{formatMoney(summary.totalAdditions)}</span>
              </div>
              <div className="day-card-summary-row">
                <span>Ventas:</span>
                <span className="positive">+{formatMoney(summary.totalSaleInputs)}</span>
              </div>
              <div className="day-card-summary-total">
                <span>Total entradas:</span>
                <span className="positive">+{formatMoney(summary.totalAdditions + summary.totalSaleInputs)}</span>
              </div>
            </div>

            <div className="day-card-summary-section">
              <h4 className="day-card-summary-title">Salidas</h4>
              <div className="day-card-summary-row">
                <span>Retirado:</span>
                <span className="negative">-{formatMoney(summary.totalWithdrawals)}</span>
              </div>
              <div className="day-card-summary-row">
                <span>Cambios:</span>
                <span className="negative">-{formatMoney(summary.totalSaleOutputs)}</span>
              </div>
              <div className="day-card-summary-total">
                <span>Total salidas:</span>
                <span className="negative">-{formatMoney(summary.totalWithdrawals + summary.totalSaleOutputs)}</span>
              </div>
            </div>
          </div>

          {summary.transactions && summary.transactions.length > 0 && (
            <div className="day-card-transactions">
              <h4 className="day-card-summary-title">Transacciones ({summary.transactions.length})</h4>
              <div className="day-card-transactions-list">
                {summary.transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="day-card-transaction">
                    <span className={`day-card-transaction-type ${transaction.type}`}>
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                    <span className={`day-card-transaction-amount ${
                      transaction.type === 'ADD' || transaction.type === 'SALE_INPUT' ? 'positive' : 'negative'
                    }`}>
                      {transaction.type === 'ADD' || transaction.type === 'SALE_INPUT' ? '+' : '-'}
                      {formatMoney(transaction.amount)}
                    </span>
                    {transaction.notes && (
                      <span className="day-card-transaction-notes">{transaction.notes}</span>
                    )}
                  </div>
                ))}
                {summary.transactions.length > 10 && (
                  <div className="day-card-transactions-more">
                    Y {summary.transactions.length - 10} transacciones más...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'ADD': 'Añadido',
    'WITHDRAW': 'Retirado',
    'SALE_INPUT': 'Venta',
    'SALE_OUTPUT': 'Cambio'
  };
  return labels[type] || type;
}

export function CajaFuerteDailyView({ summaries, onCloseDay, loading }: CajaFuerteDailyViewProps) {
  if (loading) {
    return (
      <div className="daily-view-loading">
        <div className="daily-view-spinner" />
        <span>Cargando historial...</span>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="daily-view-empty">
        <span className="daily-view-empty-icon">📅</span>
        <p>No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="cajafuerte-daily-view">
      <div className="daily-view-header">
        <h3 className="daily-view-title">Resumen por días</h3>
        <span className="daily-view-subtitle">
          {summaries.length} día{summaries.length !== 1 ? 's' : ''} mostrado{summaries.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="daily-view-list">
        {summaries.map((summary) => (
          <DayCard 
            key={summary.date} 
            summary={summary} 
            onCloseDay={onCloseDay}
          />
        ))}
      </div>
    </div>
  );
}
