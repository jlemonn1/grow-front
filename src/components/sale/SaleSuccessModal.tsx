import { useEffect, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import { useConfig } from '@/context/config.context';
import type { Sale } from '@/types/models';
import './SaleSuccessModal.css';

interface SaleSuccessModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  onNewSale?: () => void;
}

export function SaleSuccessModal({ isOpen, sale, onClose, onNewSale }: SaleSuccessModalProps) {
  const { config } = useConfig();
  const showCashDetails = config?.showCashDetails ?? true;
  const [showAnimation, setShowAnimation] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && sale) {
      setShowAnimation(true);
      
      // Auto-cierre después de 5 segundos
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      setAutoCloseTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    } else {
      setShowAnimation(false);
    }
  }, [isOpen, sale]);

  const handleClose = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    setShowAnimation(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleNewSale = () => {
    handleClose();
    if (onNewSale) {
      setTimeout(() => {
        onNewSale();
      }, 300);
    }
  };

  if (!sale) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Venta Procesada Exitosamente">
      <div className="sale-success-modal">
        <div className="sale-success-icon">
          <div className={`sale-success-checkmark ${showAnimation ? 'animate' : ''}`}>
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27l8 8 16-16"
              />
            </svg>
          </div>
        </div>

        <div className="sale-success-content">
          <h3 className="sale-success-title">¡Venta completada!</h3>
          
          <div className="sale-success-details">
            <div className="sale-success-detail-row">
              <span className="sale-success-label">Total:</span>
              <span className="sale-success-value">{formatMoney(sale.totalAmount)}</span>
            </div>
            
            <div className="sale-success-detail-row">
              <span className="sale-success-label">Productos:</span>
              <span className="sale-success-value">
                {sale.items?.length || 0} {sale.items?.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            
            {showCashDetails && sale.changeAmount !== undefined && sale.changeAmount > 0 && (
              <div className="sale-success-detail-row">
                <span className="sale-success-label">Cambio:</span>
                <span className="sale-success-value">{formatMoney(sale.changeAmount)}</span>
              </div>
            )}
          </div>

          {autoCloseTimer && (
            <div className="sale-success-autoclose">
              Este mensaje se cerrará automáticamente en unos segundos...
            </div>
          )}
        </div>

        <div className="sale-success-actions">
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          {onNewSale && (
            <Button variant="primary" onClick={handleNewSale}>
              Nueva Venta
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
