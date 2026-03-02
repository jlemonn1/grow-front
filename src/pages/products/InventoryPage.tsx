import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { useInventory } from '@/hooks/useInventory';
import { getMeasurementShortLabel } from '@/utils/measurement';
import type { InventoryProduct } from '@/types/models';
import './InventoryPage.css';

type ModalType = 'recharge' | 'set' | null;

export function InventoryPage() {
  const navigate = useNavigate();
  const {
    products,
    loading,
    error,
    productStates,
    checkedCount,
    totalCount,
    groupedProducts,
    loadInventory,
    checkProduct,
    uncheckProduct,
    rechargeProduct,
    setProductStock,
    complete,
  } = useInventory();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalProduct, setModalProduct] = useState<InventoryProduct | null>(null);
  const [modalValue, setModalValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleCancel = () => {
    navigate('/products');
  };

  const handleFinish = async () => {
    if (!isAllChecked) {
      setShowConfirmModal(true);
      return;
    }
    setSubmitting(true);
    const success = await complete();
    if (success) {
      navigate('/products');
    }
    setSubmitting(false);
  };

  const handleConfirmFinish = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    const success = await complete();
    if (success) {
      navigate('/products');
    }
    setSubmitting(false);
  };

  const openRechargeModal = (product: InventoryProduct) => {
    setModalProduct(product);
    setModalType('recharge');
    setModalValue('');
  };

  const openSetModal = (product: InventoryProduct) => {
    setModalProduct(product);
    setModalType('set');
    setModalValue(product.stockGrams.toString());
  };

  const closeModal = () => {
    setModalType(null);
    setModalProduct(null);
    setModalValue('');
  };

  const handleModalSubmit = () => {
    if (!modalProduct || !modalValue) return;
    
    const grams = Number(modalValue.replace(',', '.'));
    if (isNaN(grams) || grams < 0) return;

    if (modalType === 'recharge') {
      rechargeProduct(modalProduct.id, grams);
    } else if (modalType === 'set') {
      setProductStock(modalProduct.id, grams);
    }
    closeModal();
  };

  const isAllChecked = checkedCount === totalCount && totalCount > 0;

  const getStockLabel = (product: InventoryProduct) => {
    const unit = getMeasurementShortLabel(product.measurementType);
    return `${product.stockGrams}${unit}`;
  };

  const getSalesLabel = (product: InventoryProduct) => {
    const unit = getMeasurementShortLabel(product.measurementType);
    return `${product.todaySalesOut}${unit}`;
  };

  const calculateNewStock = (product: InventoryProduct, action: string, value: string) => {
    const grams = Number(value.replace(',', '.'));
    if (isNaN(grams)) return null;
    
    if (action === 'recharge') {
      return product.stockGrams + grams;
    } else if (action === 'set') {
      return grams;
    }
    return null;
  };

  if (loading && products.length === 0) {
    return (
      <>
        <PageHeader title="Inventario" />
        <div className="inventory-page-container">
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Inventario" />
      
      <div className="inventory-page-container" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="inventory-page-header">
          <div className={`inventory-page-counter ${isAllChecked ? 'checked' : ''}`}>
            <span>{checkedCount}/{totalCount}</span>
          </div>
          
          <div className="inventory-page-actions">
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFinish} 
              disabled={submitting}
              loading={submitting}
            >
              Terminar
            </Button>
          </div>
        </div>

        {error && (
          <div className="products-page-error">
            {error}
          </div>
        )}

        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="inventory-category-section">
            <h3 className="inventory-category-title">{category}</h3>
            
            {categoryProducts.map(product => {
              const state = productStates[product.id];
              const isChecked = state?.checked || false;
              const action = state?.action;
              const actionGrams = state?.grams;

              return (
                <div 
                  key={product.id} 
                  className={`inventory-product-card ${isChecked ? 'checked' : ''}`}
                >
                  <div className="inventory-product-info">
                    <h4 className="inventory-product-name">{product.name}</h4>
                    
                    <div className="inventory-product-stats">
                      <span className="inventory-stock-current">
                        <span className="label">Stock:</span>
                        <strong>{getStockLabel(product)}</strong>
                      </span>
                      <span className="inventory-stock-sales">
                        <span className="label">Hoy:</span>
                        {getSalesLabel(product)}
                      </span>
                    </div>
                  </div>

                  {isChecked && action && actionGrams !== undefined ? (
                    <div className="inventory-product-actions">
                      <span className={`inventory-stock-change ${action.toLowerCase()}`}>
                        {action === 'RECHARGE' && <span>+{actionGrams}</span>}
                        {action === 'SET' && <span>→{actionGrams}</span>}
                        <span style={{ opacity: 0.7 }}>{getMeasurementShortLabel(product.measurementType)}</span>
                      </span>
                      <button 
                        className="inventory-btn inventory-btn-uncheck"
                        onClick={() => uncheckProduct(product.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : isChecked ? (
                    <div className="inventory-product-actions">
                      <span className="inventory-btn-checked-badge">✓</span>
                      <button 
                        className="inventory-btn inventory-btn-uncheck"
                        onClick={() => uncheckProduct(product.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="inventory-product-actions">
                      <button 
                        className="inventory-btn inventory-btn-check"
                        onClick={() => checkProduct(product.id)}
                      >
                        ✓
                      </button>
                      <button 
                        className="inventory-btn"
                        onClick={() => openRechargeModal(product)}
                      >
                        +
                      </button>
                      <button 
                        className="inventory-btn"
                        onClick={() => openSetModal(product)}
                      >
                        =
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {products.length === 0 && !loading && (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay productos disponibles</p>
        )}
      </div>

      {modalType && modalProduct && (
        <div className="inventory-modal-overlay" onClick={closeModal}>
          <div className="inventory-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inventory-modal-title">
              {modalType === 'recharge' ? 'Añadir Recarga' : 'Establecer Stock'}
            </h3>
            <p className="inventory-modal-product">
              {modalProduct.name}
            </p>
            <p className="inventory-modal-hint">
              Stock actual: {getStockLabel(modalProduct)}
              {modalValue && (
                <> → Nuevo: <strong>{calculateNewStock(modalProduct, modalType, modalValue)}{getMeasurementShortLabel(modalProduct.measurementType)}</strong></>
              )}
            </p>
            <input
              type="number"
              className="inventory-modal-input"
              placeholder={`Cantidad en ${getMeasurementShortLabel(modalProduct.measurementType)}`}
              value={modalValue}
              onChange={e => setModalValue(e.target.value)}
              autoFocus
              step="0.01"
              min="0"
            />
            <div className="inventory-modal-actions">
              <button className="inventory-btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button 
                className="inventory-btn-primary" 
                onClick={handleModalSubmit}
                disabled={!modalValue || Number(modalValue) < 0}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="inventory-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="inventory-modal" onClick={e => e.stopPropagation()}>
            <h3 className="inventory-modal-title">
              ¿Terminar inventario?
            </h3>
            <p className="inventory-modal-product">
              Solo se procesarán los {checkedCount} productos verificados de {totalCount}.
            </p>
            <p className="inventory-modal-hint">
              Los productos sin verificar no se modificarán.
            </p>
            <div className="inventory-modal-actions">
              <button className="inventory-btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Volver
              </button>
              <button 
                className="inventory-btn-primary" 
                onClick={handleConfirmFinish}
              >
                Terminar igual
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
