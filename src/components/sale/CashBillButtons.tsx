import { useState } from 'react';
import { BillSVG } from './BillSVG';
import { CoinSVG } from './CoinSVG';
import { HiOutlineX } from 'react-icons/hi';
import type { DenominationsMap } from '@/types/models';
import './CashBillButtons.css';

interface CashBillButtonsProps {
  onAddAmount: (amount: number) => void;
  onDenominationAdd?: (denomination: number) => void;
  denominations?: DenominationsMap;
  onReset?: () => void;
}

const BILL_VALUES = [5, 10, 20, 50] as const;
const COIN_VALUES = [0.10, 0.20, 0.50, 1, 2] as const;

export function CashBillButtons({ 
  onAddAmount, 
  onDenominationAdd, 
  denominations = {},
  onReset 
}: CashBillButtonsProps) {
  const [clickedBill, setClickedBill] = useState<number | null>(null);
  const [clickedCoin, setClickedCoin] = useState<number | null>(null);
  
  const hasAnyDenominations = Object.values(denominations).some(qty => qty > 0);

  const handleBillClick = (value: number) => {
    setClickedBill(value);
    onAddAmount(value);
    onDenominationAdd?.(value);
    
    // Resetear el estado después de la animación
    setTimeout(() => {
      setClickedBill(null);
    }, 400);
  };

  const handleCoinClick = (value: number) => {
    setClickedCoin(value);
    onAddAmount(value);
    onDenominationAdd?.(value);
    
    // Resetear el estado después de la animación
    setTimeout(() => {
      setClickedCoin(null);
    }, 400);
  };

  const getDenominationCount = (value: number): number => {
    return denominations[value.toString()] || 0;
  };

  return (
    <div className="cash-money-buttons">
      {/* Título general y botón resetear */}
      <div className="cash-money-header">
        <div className="cash-money-label">Billetes y monedas</div>
        {hasAnyDenominations && onReset && (
          <button
            type="button"
            className="cash-money-reset-button"
            onClick={onReset}
            aria-label="Resetear todo el dinero"
            title="Resetear todo"
          >
            <HiOutlineX />
            Resetear
          </button>
        )}
      </div>

      {/* Sección de billetes */}
      <div className="cash-bills-section">
        <div className="cash-bill-buttons">
          {BILL_VALUES.map((value) => {
            const count = getDenominationCount(value);
            return (
              <div key={value} className="cash-bill-button-wrapper">
                <button
                  type="button"
                  className={`cash-bill-button cash-bill-${value} ${clickedBill === value ? 'cash-bill-clicked' : ''}`}
                  onClick={() => handleBillClick(value)}
                  aria-label={`Agregar ${value} euros`}
                >
                  <BillSVG value={value} className="cash-bill-svg" />
                  {count > 0 && (
                    <span className="cash-denomination-badge">{count}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección de monedas */}
      <div className="cash-coins-section">
        <div className="cash-coins-buttons">
          {COIN_VALUES.map((value) => {
            const count = getDenominationCount(value);
            return (
              <div key={value} className="cash-coin-button-wrapper">
                <button
                  type="button"
                  className={`cash-coin-button cash-coin-${value.toString().replace('.', '-')} ${clickedCoin === value ? 'cash-coin-clicked' : ''}`}
                  onClick={() => handleCoinClick(value)}
                  aria-label={`Agregar ${value >= 1 ? `${value} euros` : `${value * 100} céntimos`}`}
                >
                  <CoinSVG value={value} className="cash-coin-svg" />
                  {count > 0 && (
                    <span className="cash-denomination-badge">{count}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
