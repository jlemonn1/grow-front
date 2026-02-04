import { useState, useEffect, useCallback, useMemo } from 'react';
import { DenominationSelector } from '@/components/cajafuerte/DenominationSelector';
import { Button } from '@/components/common/Button';
import { calculateOptimalChange, getCurrentState } from '@/services/cajafuerte.service';
import { getDenominationLabel } from '@/utils/denominations';
import { formatMoney } from '@/utils/money';
import { useUI } from '@/context/ui.context';
import type { DenominationsMap, CajaFuerte } from '@/types/models';
import { HiArrowPath, HiExclamationTriangle } from 'react-icons/hi2';
import './CashDenominationsSelector.css';

interface CashDenominationsSelectorProps {
  changeAmount: number;
  changeDenominations: DenominationsMap | null;
  onChangeDenominationsChange: (denominations: DenominationsMap | null) => void;
  disabled?: boolean;
}

export function CashDenominationsSelector({
  changeAmount,
  changeDenominations,
  onChangeDenominationsChange,
  disabled = false,
}: CashDenominationsSelectorProps) {
  const { showToast } = useUI();
  const [cajaFuerte, setCajaFuerte] = useState<CajaFuerte | null>(null);
  const [loadingChange, setLoadingChange] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  // Cargar estado de CajaFuerte al montar
  useEffect(() => {
    const loadCajaFuerte = async () => {
      try {
        const state = await getCurrentState();
        setCajaFuerte(state);
      } catch (error) {
        console.error('Error al cargar CajaFuerte:', error);
      }
    };
    loadCajaFuerte();
  }, []);

  // Calcular cambio automáticamente cuando cambia changeAmount
  const calculateChange = useCallback(async () => {
    if (changeAmount <= 0) {
      onChangeDenominationsChange(null);
      setChangeError(null);
      return;
    }

    setLoadingChange(true);
    setChangeError(null);

    try {
      const result = await calculateOptimalChange(changeAmount);
      onChangeDenominationsChange(result.denominations);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al calcular cambio';
      setChangeError(errorMessage);
      onChangeDenominationsChange(null);
      showToast(errorMessage, 'error');
    } finally {
      setLoadingChange(false);
    }
  }, [changeAmount, onChangeDenominationsChange, showToast]);

  // Calcular cambio cuando cambia changeAmount
  useEffect(() => {
    if (changeAmount > 0) {
      calculateChange();
    } else {
      onChangeDenominationsChange(null);
      setChangeError(null);
    }
  }, [changeAmount, calculateChange, onChangeDenominationsChange]);

  // Validar disponibilidad de cambio
  const validateChangeAvailability = useCallback(() => {
    if (!changeDenominations || !cajaFuerte) {
      return null;
    }

    const issues: string[] = [];
    for (const [denomination, quantity] of Object.entries(changeDenominations)) {
      const available = cajaFuerte.denominations[denomination] || 0;
      if (quantity > available) {
        issues.push(`${quantity}x ${getDenominationLabel(parseFloat(denomination))} (disponibles: ${available})`);
      }
    }

    return issues.length > 0 ? issues : null;
  }, [changeDenominations, cajaFuerte]);

  const availabilityIssues = useMemo(() => validateChangeAvailability(), [validateChangeAvailability]);

  return (
    <div className="cash-denominations-selector">
      {changeAmount > 0 && (
        <div className="cash-denominations-section">
          <div className="cash-denominations-section-header">
            <h4 className="cash-denominations-section-title">Cambio a dar: {formatMoney(changeAmount)}</h4>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={calculateChange}
              disabled={disabled || loadingChange}
              icon={<HiArrowPath />}
            >
              Recalcular
            </Button>
          </div>

          {loadingChange ? (
            <div className="cash-denominations-loading">Calculando cambio...</div>
          ) : changeError ? (
            <div className="cash-denominations-error">
              <HiExclamationTriangle />
              {changeError}
            </div>
          ) : changeDenominations ? (
            <>
              <DenominationSelector
                denominations={changeDenominations}
                onChange={onChangeDenominationsChange}
                availableDenominations={cajaFuerte?.denominations}
                disabled={disabled}
                showTotal={true}
              />
              {availabilityIssues && (
                <div className="cash-denominations-warning">
                  <HiExclamationTriangle />
                  <div>
                    <strong>Advertencia:</strong> No hay suficientes denominaciones disponibles:
                    <ul>
                      {availabilityIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="cash-denominations-empty">
              Calculando cambio...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
