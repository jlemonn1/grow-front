import { useState } from 'react';
import { BillSVG } from './BillSVG';
import { CoinSVG } from './CoinSVG';
import './CashBillButtons.css';

interface CashBillButtonsProps {
  onAddAmount: (amount: number) => void;
}

const BILL_VALUES = [5, 10, 20, 50] as const;
const COIN_VALUES = [0.10, 0.20, 0.50, 1, 2] as const;

export function CashBillButtons({ onAddAmount }: CashBillButtonsProps) {
  const [clickedBill, setClickedBill] = useState<number | null>(null);
  const [clickedCoin, setClickedCoin] = useState<number | null>(null);

  const handleBillClick = (value: number) => {
    setClickedBill(value);
    onAddAmount(value);
    
    // Resetear el estado después de la animación
    setTimeout(() => {
      setClickedBill(null);
    }, 400);
  };

  const handleCoinClick = (value: number) => {
    setClickedCoin(value);
    onAddAmount(value);
    
    // Resetear el estado después de la animación
    setTimeout(() => {
      setClickedCoin(null);
    }, 400);
  };

  return (
    <div className="cash-money-buttons">
      {/* Título general */}
      <div className="cash-money-label">Billetes y monedas</div>

      {/* Sección de billetes */}
      <div className="cash-bills-section">
        <div className="cash-bill-buttons">
          {BILL_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              className={`cash-bill-button cash-bill-${value} ${clickedBill === value ? 'cash-bill-clicked' : ''}`}
              onClick={() => handleBillClick(value)}
              aria-label={`Agregar ${value} euros`}
            >
              <BillSVG value={value} className="cash-bill-svg" />
            </button>
          ))}
        </div>
      </div>

      {/* Sección de monedas */}
      <div className="cash-coins-section">
        <div className="cash-coins-buttons">
          {COIN_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              className={`cash-coin-button cash-coin-${value.toString().replace('.', '-')} ${clickedCoin === value ? 'cash-coin-clicked' : ''}`}
              onClick={() => handleCoinClick(value)}
              aria-label={`Agregar ${value >= 1 ? `${value} euros` : `${value * 100} céntimos`}`}
            >
              <CoinSVG value={value} className="cash-coin-svg" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
