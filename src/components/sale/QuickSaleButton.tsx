import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { QuickSaleModal } from './QuickSaleModal';
import { useConfig } from '@/context/config.context';
import './QuickSaleButton.css';

export function QuickSaleButton() {
  const navigate = useNavigate();
  const { quickSaleMode } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDispensar, setShowDispensar] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      // Mostrar el mensaje cada 4 segundos cuando el modal está cerrado
      const interval = setInterval(() => {
        setShowDispensar(true);
        // Ocultar después de que termine la animación (2.5s)
        setTimeout(() => {
          setShowDispensar(false);
        }, 2500);
      }, 4000);

      // Mostrar inmediatamente al montar si está cerrado
      setShowDispensar(true);
      setTimeout(() => {
        setShowDispensar(false);
      }, 2500);

      return () => clearInterval(interval);
    } else {
      setShowDispensar(false);
    }
  }, [isModalOpen]);

  return (
    <>
      <div className="quick-sale-button-wrapper">
        {!isModalOpen && showDispensar && (
          <div className="quick-sale-dispensar-message">
            <div className="quick-sale-dispensar-smoke">
              <div className="quick-sale-smoke-particle quick-sale-smoke-1"></div>
              <div className="quick-sale-smoke-particle quick-sale-smoke-2"></div>
              <div className="quick-sale-smoke-particle quick-sale-smoke-3"></div>
              <div className="quick-sale-smoke-particle quick-sale-smoke-4"></div>
              <div className="quick-sale-dispensar-text">dispensar!!</div>
            </div>
          </div>
        )}
        <button
          className="quick-sale-button"
          onClick={() => {
            if (quickSaleMode === 'redirect') {
              navigate('/sales/new');
            } else {
              setIsModalOpen(true);
            }
          }}
          aria-label="Dispensación rápida"
          type="button"
        >
          {/* SVG para la animación láser del círculo */}
          <svg className="quick-sale-button-laser" viewBox="0 0 80 80">
            <defs>
              <filter id="neon-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <circle
              className="quick-sale-button-laser-circle"
              cx="40"
              cy="40"
              r="38"
            />
            {/* Punto láser brillante que se mueve por el círculo */}
            <g className="quick-sale-button-laser-dot">
              <circle
                cx="78"
                cy="40"
                r="4"
                fill="var(--color-primary)"
                filter="url(#neon-glow)"
              />
              <circle
                cx="78"
                cy="40"
                r="2"
                fill="white"
                opacity="0.9"
              />
            </g>
          </svg>
          
          {/* Icono del carrito con animación láser */}
          <div className="quick-sale-button-icon-wrapper">
            <HiOutlineShoppingCart className="quick-sale-button-icon" />
            {/* SVG para trazar el contorno del icono - path del icono outline de Heroicons */}
            <svg className="quick-sale-button-icon-svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
              <path
                className="quick-sale-button-icon-path"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>
      {isModalOpen && quickSaleMode === 'modal' && createPortal(
        <QuickSaleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />,
        document.body
      )}
    </>
  );
}

/**
 * Hook para obtener y configurar el modo de venta rápida
 * @returns [mode, setMode] - El modo actual y la función para cambiarlo
 */
export function useQuickSaleMode() {
  const { quickSaleMode, setQuickSaleMode } = useConfig();
  return [quickSaleMode, setQuickSaleMode] as const;
}
