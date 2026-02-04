import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { CajaFuerteSummary } from '@/components/cajafuerte/CajaFuerteSummary';
import { CajaFuerteHistory } from '@/components/cajafuerte/CajaFuerteHistory';
import { AddMoneyModal } from '@/components/cajafuerte/AddMoneyModal';
import { WithdrawMoneyModal } from '@/components/cajafuerte/WithdrawMoneyModal';
import { ChangeDenominationsModal } from '@/components/cajafuerte/ChangeDenominationsModal';
import { getCurrentState } from '@/services/cajafuerte.service';
import { useUI } from '@/context/ui.context';
import type { CajaFuerte } from '@/types/models';
import { HiPlus, HiMinus, HiArrowsRightLeft } from 'react-icons/hi2';
import './CajaFuertePage.css';

export function CajaFuertePage() {
  const { showToast, setGlobalLoading } = useUI();
  const [cajaFuerte, setCajaFuerte] = useState<CajaFuerte | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  const loadCajaFuerte = useCallback(async () => {
    setLoading(true);
    try {
      const state = await getCurrentState();
      setCajaFuerte(state);
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
    loadCajaFuerte();
  }, [loadCajaFuerte]);

  const handleSuccess = () => {
    loadCajaFuerte();
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

  return (
    <div className="cajafuerte-page">
      <PageHeader 
        title="CajaFuerte" 
        subtitle="Gestión de dinero físico (billetes y monedas)" 
      />

      <div className="cajafuerte-page-content">
        <div className="cajafuerte-page-main">
          <CajaFuerteSummary cajaFuerte={cajaFuerte} />

          <div className="cajafuerte-page-actions">
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              icon={<HiPlus />}
            >
              Añadir dinero
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowWithdrawModal(true)}
              icon={<HiMinus />}
            >
              Retirar dinero
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowChangeModal(true)}
              icon={<HiArrowsRightLeft />}
            >
              Cambiar denominaciones
            </Button>
          </div>
        </div>

        <div className="cajafuerte-page-history">
          <h2 className="cajafuerte-page-history-title">Historial de transacciones</h2>
          <CajaFuerteHistory />
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

      <ChangeDenominationsModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        onSuccess={handleSuccess}
        currentState={cajaFuerte}
      />
    </div>
  );
}
