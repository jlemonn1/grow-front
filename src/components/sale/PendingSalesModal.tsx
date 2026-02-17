import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import { getAllPendingSales, deletePendingSale, recoverPendingSale, getSaleDraft } from '@/services/sales.service';
import { useUI } from '@/context/ui.context';
import { useProducts } from '@/context/products.context';
import { getMeasurementShortLabel } from '@/utils/measurement';
import type { PendingSale } from '@/types/models';
import { HiTrash, HiEye, HiArrowPath } from 'react-icons/hi2';
import './PendingSalesModal.css';

interface PendingSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecover: (pendingSale: PendingSale) => void;
}

export function PendingSalesModal({ isOpen, onClose, onRecover }: PendingSalesModalProps) {
  const { showToast, setGlobalLoading } = useUI();
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<PendingSale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { products } = useProducts();

  const getMeasurementSuffix = useCallback((productId?: string | null) => {
    const product = productId ? products.find((p) => p.id === productId) : undefined;
    return getMeasurementShortLabel(product?.measurementType ?? 'WEIGHT');
  }, [products]);

  // Cargar pendientes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadPendingSales();
    } else {
      setSelectedForDetails(null);
    }
  }, [isOpen]);

  const loadPendingSales = useCallback(async () => {
    setLoading(true);
    try {
      const sales = await getAllPendingSales();
      setPendingSales(sales);
    } catch (error) {
      console.error('Error al cargar pedidos pendientes:', error);
      showToast('Error al cargar pedidos pendientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleRecover = useCallback(async (pendingSale: PendingSale) => {
    if (!pendingSale.customerId) {
      showToast('Este pedido pendiente no tiene cliente asociado', 'warning');
      return;
    }

    try {
      setGlobalLoading(true);
      
      // Verificar si hay borrador actual y guardarlo como pendiente antes de recuperar
      // (El backend ya lo hace, pero lo verificamos aquí para feedback)
      const currentDraft = await getSaleDraft();
      if (currentDraft && (currentDraft.customerId || (currentDraft.items && currentDraft.items.length > 0))) {
        // El backend convertirá automáticamente el borrador en pendiente
        // No necesitamos hacer nada aquí, solo informar
      }
      
      // Recuperar el pendiente (el backend convierte el borrador actual en pendiente primero y elimina el recuperado)
      await recoverPendingSale(pendingSale.customerId);
      
      // Eliminar el pendiente recuperado de la lista inmediatamente
      // (El backend ya lo eliminó, solo actualizamos la UI)
      setPendingSales(prev => prev.filter(ps => ps.id !== pendingSale.id));
      
      onRecover(pendingSale);
      showToast('Pedido pendiente recuperado exitosamente', 'success');
      onClose();
    } catch (error) {
      console.error('Error al recuperar pedido pendiente:', error);
      showToast('Error al recuperar pedido pendiente', 'error');
    } finally {
      setGlobalLoading(false);
    }
  }, [showToast, setGlobalLoading, onRecover, onClose]);

  const handleDelete = useCallback(async (pendingSale: PendingSale, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!pendingSale.customerId) {
      showToast('No se puede eliminar este pedido pendiente', 'error');
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el pedido pendiente de ${pendingSale.customerName || 'este cliente'}?`)) {
      return;
    }

    setDeletingId(pendingSale.id);
    try {
      await deletePendingSale(pendingSale.customerId);
      showToast('Pedido pendiente eliminado exitosamente', 'success');
      await loadPendingSales();
    } catch (error) {
      console.error('Error al eliminar pedido pendiente:', error);
      showToast('Error al eliminar pedido pendiente', 'error');
    } finally {
      setDeletingId(null);
    }
  }, [showToast, loadPendingSales]);

  const handleViewDetails = useCallback((pendingSale: PendingSale, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForDetails(pendingSale);
  }, []);

  if (selectedForDetails) {
    return (
      <PendingSaleDetailsModal
        isOpen={true}
        pendingSale={selectedForDetails}
        getMeasurementSuffix={getMeasurementSuffix}
        onClose={() => setSelectedForDetails(null)}
        onRecover={handleRecover}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Pedidos Pendientes"
    >
      <div className="pending-sales-modal">
        {loading ? (
          <div className="pending-sales-loading">
            <p>Cargando pedidos pendientes...</p>
          </div>
        ) : pendingSales.length === 0 ? (
          <div className="pending-sales-empty">
            <p>No hay pedidos pendientes guardados.</p>
          </div>
        ) : (
          <div className="pending-sales-list">
            {pendingSales.map((pendingSale) => (
              <div key={pendingSale.id} className="pending-sale-item">
                <div className="pending-sale-main-info">
                  <div className="pending-sale-header">
                    <h3 className="pending-sale-customer">
                      {pendingSale.customerName || 'Sin cliente'}
                    </h3>
                    <span className="pending-sale-date">
                      {formatDateTime(pendingSale.createdAt)}
                    </span>
                  </div>
                  
                  <div className="pending-sale-summary">
                    <div className="pending-sale-summary-item">
                      <span className="pending-sale-label">Productos:</span>
                      <span className="pending-sale-value">
                        {pendingSale.itemsCount || pendingSale.items.length} {pendingSale.itemsCount === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                    {pendingSale.cashGiven > 0 && (
                      <div className="pending-sale-summary-item">
                        <span className="pending-sale-label">Efectivo:</span>
                        <span className="pending-sale-value">
                          {formatMoney(pendingSale.cashGiven)}
                        </span>
                      </div>
                    )}
                    {pendingSale.selectedProductId && (
                      <div className="pending-sale-summary-item pending-sale-badge">
                        <span>Producto seleccionado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pending-sale-actions">
                  <Button
                    type="button"
                    variant="primary"
                    size="small"
                    onClick={() => handleRecover(pendingSale)}
                    icon={<HiArrowPath />}
                  >
                    Recuperar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={(e) => handleViewDetails(pendingSale, e)}
                    icon={<HiEye />}
                    title="Ver detalles"
                  >
                    {' '}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    onClick={(e) => handleDelete(pendingSale, e)}
                    icon={<HiTrash />}
                    loading={deletingId === pendingSale.id}
                    disabled={deletingId === pendingSale.id}
                    title="Eliminar"
                  >
                    {' '}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Componente interno para mostrar detalles
interface PendingSaleDetailsModalProps {
  isOpen: boolean;
  pendingSale: PendingSale;
  getMeasurementSuffix: (productId?: string | null) => string;
  onClose: () => void;
  onRecover: (pendingSale: PendingSale) => void;
  onDelete: (pendingSale: PendingSale, e: React.MouseEvent) => void;
}

function PendingSaleDetailsModal({
  isOpen,
  pendingSale,
  getMeasurementSuffix,
  onClose,
  onRecover,
  onDelete,
}: PendingSaleDetailsModalProps) {
  const totalGrams = pendingSale.items.reduce((sum, item) => sum + item.grams, 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Detalles - ${pendingSale.customerName || 'Sin cliente'}`}
    >
      <div className="pending-sale-details">
        <div className="pending-sale-details-section">
          <h4>Información General</h4>
          <div className="pending-sale-details-grid">
            <div className="pending-sale-details-item">
              <span className="pending-sale-details-label">Cliente:</span>
              <span className="pending-sale-details-value">
                {pendingSale.customerName || 'Sin cliente'}
              </span>
            </div>
            <div className="pending-sale-details-item">
              <span className="pending-sale-details-label">Fecha:</span>
              <span className="pending-sale-details-value">
                {formatDateTime(pendingSale.createdAt)}
              </span>
            </div>
            <div className="pending-sale-details-item">
              <span className="pending-sale-details-label">Efectivo recibido:</span>
              <span className="pending-sale-details-value">
                {formatMoney(pendingSale.cashGiven)}
              </span>
            </div>
          </div>
        </div>

        {pendingSale.items.length > 0 && (
          <div className="pending-sale-details-section">
            <h4>Productos en el Ticket ({pendingSale.items.length})</h4>
             <div className="pending-sale-items-list">
               {pendingSale.items.map((item, index) => {
                 const suffix = getMeasurementSuffix(item.productId);
                 return (
                   <div key={index} className="pending-sale-item-row">
                     <span className="pending-sale-item-product">Producto ID: {item.productId}</span>
                     <span className="pending-sale-item-grams">{item.grams.toFixed(2)}{suffix}</span>
                      {/* Descuentos se aplican a nivel total de venta, no por item */}
                    </div>
                 );
               })}
             </div>
             <div className="pending-sale-total-grams">
               <strong>
                 Total cantidad: {totalGrams.toFixed(2)}{
                   pendingSale.items.length > 0 ? getMeasurementSuffix(pendingSale.items[0].productId) : 'g'
                 }
               </strong>
             </div>
          </div>
        )}

        {pendingSale.selectedProductId && (
          <div className="pending-sale-details-section">
            <h4>Estado del Formulario</h4>
            <div className="pending-sale-details-grid">
              <div className="pending-sale-details-item">
                <span className="pending-sale-details-label">Producto seleccionado:</span>
                <span className="pending-sale-details-value">
                  ID: {pendingSale.selectedProductId}
                </span>
              </div>
              {pendingSale.gramsToAdd && pendingSale.gramsToAdd > 0 && (
              <div className="pending-sale-details-item">
                <span className="pending-sale-details-label">Cantidad:</span>
                <span className="pending-sale-details-value">
                  {pendingSale.gramsToAdd.toFixed(2)}{getMeasurementSuffix(pendingSale.selectedProductId)}
                </span>
              </div>
              )}
            </div>
          </div>
        )}

        {(pendingSale.useBalance || pendingSale.balanceToUse) && (
          <div className="pending-sale-details-section">
            <h4>Configuración de Saldo</h4>
            <div className="pending-sale-details-grid">
              <div className="pending-sale-details-item">
                <span className="pending-sale-details-label">Usar saldo:</span>
                <span className="pending-sale-details-value">
                  {pendingSale.useBalance ? 'Sí' : 'No'}
                </span>
              </div>
              {pendingSale.balanceToUse && pendingSale.balanceToUse > 0 && (
                <div className="pending-sale-details-item">
                  <span className="pending-sale-details-label">Saldo a usar:</span>
                  <span className="pending-sale-details-value">
                    {formatMoney(pendingSale.balanceToUse)}
                  </span>
                </div>
              )}
              <div className="pending-sale-details-item">
                <span className="pending-sale-details-label">Guardar cambio en saldo:</span>
                <span className="pending-sale-details-value">
                  {pendingSale.saveChangeToBalance ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {pendingSale.cashGivenDenominations && Object.keys(pendingSale.cashGivenDenominations).length > 0 && (
          <div className="pending-sale-details-section">
            <h4>Denominaciones Recibidas</h4>
            <div className="pending-sale-denominations">
              {Object.entries(pendingSale.cashGivenDenominations)
                .filter(([_, qty]) => qty > 0)
                .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                .map(([denomination, qty]) => (
                  <span key={denomination} className="pending-sale-denomination-item">
                    {qty}x {parseFloat(denomination).toFixed(2)}€
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="pending-sale-details-actions">
          <Button
            type="button"
            variant="primary"
            onClick={() => onRecover(pendingSale)}
            icon={<HiArrowPath />}
          >
            Recuperar Pedido
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={(e) => {
              onDelete(pendingSale, e);
              onClose();
            }}
            icon={<HiTrash />}
          >
            Eliminar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
