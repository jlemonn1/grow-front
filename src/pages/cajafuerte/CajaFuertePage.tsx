import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { CajaFuerteSummary } from '@/components/cajafuerte/CajaFuerteSummary';
import { CajaFuerteHistory } from '@/components/cajafuerte/CajaFuerteHistory';
import { AddMoneyModal } from '@/components/cajafuerte/AddMoneyModal';
import { WithdrawMoneyModal } from '@/components/cajafuerte/WithdrawMoneyModal';
import { CajaClosedModal } from '@/components/cajafuerte/CajaClosedModal';
import { getCurrentState, getTodayStatus, closeDay } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import type { CajaFuerte, TodayStatus } from '@/types/models';
import { HiPlus, HiMinus, HiLockClosed, HiClock } from 'react-icons/hi2';
import './CajaFuertePage.css';

export function CajaFuertePage() {
  const { showToast } = useUI();
  const [cajaFuerte, setCajaFuerte] = useState<CajaFuerte | null>(null);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [closingDay, setClosingDay] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [state, status] = await Promise.all([
        getCurrentState(),
        getTodayStatus()
      ]);
      setCajaFuerte(state);
      setTodayStatus(status);
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || 'Error al cargar CajaFuerte',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSuccess = () => {
    loadData();
    setHistoryRefreshTrigger(prev => prev + 1);
  };

  const handleCloseDay = async () => {
    if (!todayStatus) return;
    
    // Verificar que la caja no esté ya cerrada
    if (isTodayClosed) {
      showToast('La caja ya está cerrada', 'warning');
      await loadData(); // Refrescar estado
      return;
    }
    
    setClosingDay(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await closeDay({ date: today });
      showToast('Caja cerrada exitosamente', 'success');
      loadData();
      setHistoryRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al cerrar la caja';
      showToast(errorMessage, 'error');
      // Si el error indica que ya está cerrada, refrescar el estado
      if (errorMessage.includes('ya fue cerrado') || errorMessage.includes('ya está cerrada')) {
        loadData();
      }
    } finally {
      setClosingDay(false);
    }
  };

  if (loading && !cajaFuerte) {
    return (
      <div className="cajafuerte-page-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!cajaFuerte) {
    return (
      <div className="cajafuerte-page-error">
        <p>Error al cargar CajaFuerte</p>
      </div>
    );
  }

  const isTodayClosed = todayStatus?.isClosed ?? false;

  const handleAddMoneyClick = () => {
    if (isTodayClosed) {
      setShowClosedModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleWithdrawMoneyClick = () => {
    if (isTodayClosed) {
      setShowClosedModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  const handleReopenSuccess = () => {
    loadData();
    setHistoryRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="cajafuerte-page">
      <PageHeader 
        title="CajaFuerte" 
        subtitle="Gestión de dinero" 
      />

      {/* Status Banner */}
      {todayStatus && (
        <div className={`cajafuerte-status-banner ${isTodayClosed ? 'closed' : 'open'}`}>
          <div className="cajafuerte-status-content">
            <div className="cajafuerte-status-icon">
              {isTodayClosed ? <HiLockClosed /> : <HiClock className="pulse" />}
            </div>
            <div className="cajafuerte-status-text">
              <span className="cajafuerte-status-label">
                {isTodayClosed 
                  ? `Caja cerrada ${todayStatus.isAutoClosed ? 'automáticamente' : `por ${todayStatus.closedByUsername}`}` 
                  : 'Caja abierta - Día en curso'}
              </span>
              {isTodayClosed && todayStatus.closedAt && (
                <span className="cajafuerte-status-time">
                  {new Date(todayStatus.closedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          {!isTodayClosed && (
            <Button
              variant="primary"
              onClick={handleCloseDay}
              loading={closingDay}
              disabled={closingDay || isTodayClosed}
              icon={<HiLockClosed />}
            >
              Cerrar Caja
            </Button>
          )}
        </div>
      )}

      <div className="cajafuerte-page-content">
        <div className="cajafuerte-page-main">
          <CajaFuerteSummary cajaFuerte={cajaFuerte} />

          <div className="cajafuerte-page-actions">
            <Button
              variant="primary"
              onClick={handleAddMoneyClick}
              icon={<HiPlus />}
            >
              Añadir dinero
            </Button>
            <Button
              variant="secondary"
              onClick={handleWithdrawMoneyClick}
              icon={<HiMinus />}
            >
              Retirar dinero
            </Button>
          </div>
        </div>

        <div className="cajafuerte-page-history">
          <h2 className="cajafuerte-page-history-title">Historial</h2>
          <CajaFuerteHistory refreshTrigger={historyRefreshTrigger} />
        </div>
      </div>

      <AddMoneyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />

      <WithdrawMoneyModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleSuccess}
        currentState={cajaFuerte}
      />

      <CajaClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
        onReopenSuccess={handleReopenSuccess}
      />
    </div>
  );
}
