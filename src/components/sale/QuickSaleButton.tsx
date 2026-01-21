import { useState } from 'react';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { QuickSaleModal } from './QuickSaleModal';
import './QuickSaleButton.css';

export function QuickSaleButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="quick-sale-button"
        onClick={() => setIsModalOpen(true)}
        aria-label="Venta rápida"
        type="button"
      >
        <HiOutlineShoppingCart className="quick-sale-button-icon" />
      </button>
      <QuickSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
