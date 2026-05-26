import { useState, useRef, useCallback, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { CustomerAvatar } from '@/components/common/CustomerAvatar';
import { formatMoney } from '@/utils/money';
import { formatDate, formatDateTime } from '@/utils/dates';
import { buildCustomerImageUrl } from '@/utils/apiUrl';
import { Modal } from '@/components/common/Modal';
import type { Customer } from '@/types/models';
import './SelectedCustomerChip.css';

interface SelectedCustomerChipProps {
  customer: Customer;
  onClear: () => void;
}

type SubscriptionStatus = 'active' | 'expiring' | 'expired';

function getSubscriptionStatus(endDate: string): SubscriptionStatus {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  const diffTime = endDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring';
  return 'active';
}

export function SelectedCustomerChip({ customer, onClear }: SelectedCustomerChipProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const status = getSubscriptionStatus(customer.subscriptionEndDate);
  const statusClass = `subscription-badge--${status}`;

  const clearPress = useCallback(() => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const startPress = useCallback(() => {
    setIsPressing(true);
    pressTimerRef.current = window.setTimeout(() => {
      setIsPressing(false);
      setShowDetailModal(true);
    }, 1000);
  }, []);

  const handleTouchStart = () => {
    startPress();
  };

  const handleTouchEnd = () => {
    clearPress();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    startPress();
  };

  const handleMouseUp = () => {
    clearPress();
  };

  const handleMouseLeave = () => {
    clearPress();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const resolvedImageUrl = buildCustomerImageUrl(customer.profilePictureUrl);

  return (
    <>
      <div
        ref={containerRef}
        className={`selected-customer-chip ${isPressing ? 'is-pressing' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={clearPress}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
      >
        {isPressing && (
          <div className="long-tap-indicator">
            <svg className="long-tap-ring" viewBox="0 0 36 36">
              <circle
                className="long-tap-ring-bg"
                cx="18"
                cy="18"
                r="16"
              />
              <circle
                className="long-tap-ring-progress"
                cx="18"
                cy="18"
                r="16"
              />
            </svg>
          </div>
        )}

        <CustomerAvatar
          name={customer.displayName}
          imageUrl={customer.profilePictureUrl}
          size={28}
          className="selected-customer-chip-avatar"
        />
        <div className="selected-customer-chip-info">
          <span className="selected-customer-chip-name" title={customer.displayName}>
            {customer.displayName}
          </span>
          {customer.balance !== undefined && (
            <span className="selected-customer-chip-balance">
              {formatMoney(customer.balance)}
            </span>
          )}
          <span className={`subscription-badge ${statusClass}`}>
            Caduca: {formatDate(customer.subscriptionEndDate)}
          </span>
        </div>
        <button
          type="button"
          className="selected-customer-chip-clear"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label="Borrar selección y reiniciar"
          title="Borrar selección y reiniciar"
        >
          <HiX />
        </button>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={customer.displayName}
        showCloseButton={true}
        closeOnOverlayClick={true}
        closeOnEscape={true}
      >
        <div className="customer-detail-modal">
          <div className="customer-detail-photo-section">
            {resolvedImageUrl ? (
              <img
                src={resolvedImageUrl}
                alt={`Foto de ${customer.displayName}`}
                className="customer-detail-photo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <CustomerAvatar
                name={customer.displayName}
                size={120}
                className="customer-detail-photo-fallback"
              />
            )}
          </div>

          <div className="customer-detail-grid">
            {customer.pin && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">PIN</span>
                <span className="customer-detail-value">{customer.pin}</span>
              </div>
            )}
            {customer.phone && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Teléfono</span>
                <span className="customer-detail-value">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Email</span>
                <span className="customer-detail-value">{customer.email}</span>
              </div>
            )}
            {customer.dniNumber && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">DNI</span>
                <span className="customer-detail-value">{customer.dniNumber}</span>
              </div>
            )}
            {customer.address && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Dirección</span>
                <span className="customer-detail-value">{customer.address}</span>
              </div>
            )}
            {customer.fechaDeNacimiento && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Fecha de nacimiento</span>
                <span className="customer-detail-value">{formatDate(customer.fechaDeNacimiento)}</span>
              </div>
            )}
            <div className="customer-detail-item">
              <span className="customer-detail-label">Tipo de suscripción</span>
              <span className="customer-detail-value">
                {customer.subscriptionType === 'MONTHLY' ? 'Mensual' : 'Anual'}
              </span>
            </div>
            <div className="customer-detail-item">
              <span className="customer-detail-label">Precio de suscripción</span>
              <span className="customer-detail-value">{formatMoney(customer.subscriptionPrice)}</span>
            </div>
            <div className="customer-detail-item">
              <span className="customer-detail-label">Inicio de suscripción</span>
              <span className="customer-detail-value">{formatDate(customer.subscriptionStartDate)}</span>
            </div>
            <div className="customer-detail-item">
              <span className="customer-detail-label">Caducidad de suscripción</span>
              <span className={`customer-detail-value ${statusClass}`}>
                {formatDate(customer.subscriptionEndDate)}
              </span>
            </div>
            {customer.balance !== undefined && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Saldo</span>
                <span className="customer-detail-value">{formatMoney(customer.balance)}</span>
              </div>
            )}
            {customer.balanceLocked !== undefined && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Saldo bloqueado</span>
                <span className="customer-detail-value">{customer.balanceLocked ? 'Sí' : 'No'}</span>
              </div>
            )}
            <div className="customer-detail-item">
              <span className="customer-detail-label">Tipo de cliente</span>
              <span className="customer-detail-value">
                {customer.customerType === 'LUDICO' ? 'Lúdico' : 'Terapéutico'}
              </span>
            </div>
            {customer.estimatedMonthlyConsumptionGrams !== undefined && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Consumo estimado</span>
                <span className="customer-detail-value">{customer.estimatedMonthlyConsumptionGrams} g/mes</span>
              </div>
            )}
            {customer.guarantorDisplayName && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Aval</span>
                <span className="customer-detail-value">{customer.guarantorDisplayName}</span>
              </div>
            )}
            {customer.contractSignedAt && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Contrato firmado</span>
                <span className="customer-detail-value">{formatDateTime(customer.contractSignedAt)}</span>
              </div>
            )}
            {customer.notes && (
              <div className="customer-detail-item customer-detail-item--full">
                <span className="customer-detail-label">Notas</span>
                <span className="customer-detail-value">{customer.notes}</span>
              </div>
            )}
            {customer.createdAt && (
              <div className="customer-detail-item">
                <span className="customer-detail-label">Registrado el</span>
                <span className="customer-detail-value">{formatDateTime(customer.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
