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

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleCancel = () => {
    navigate('/products');
  };

  const handleFinish = async () => {
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

  if (loading && products.length === 0) {
    return (
      <>
        <PageHeader title="Inventario" />
        <div className="inventory-page-container">
          <p>Cargando...</p>
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
            <span>{checkedCount}/{totalCount} verificados</span>
          </div>
          
          <div className="inventory-page-actions">
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleFinish} 
              disabled={!isAllChecked || submitting}
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

              return (
                <div 
                  key={product.id} 
                  className={`inventory-product-card ${isChecked ? 'checked' : ''}`}
                >
                  <div className="inventory-product-header">
                    <h4 className="inventory-product-name">{product.name}</h4>
                    {isChecked && (
                      <span style={{ color: 'var(--color-success)' }}>✓</span>
                    )}
                  </div>
                  
                  <div className="inventory-product-stock">
                    <span className="inventory-stock-current">
                      Stock: {getStockLabel(product)}
                    </span>
                    <span className="inventory-stock-sales">
                      Salidas hoy: {getSalesLabel(product)}
                    </span>
                  </div>

                  {isChecked ? (
                    <div className="inventory-product-actions">
                      <button 
                        className="inventory-btn inventory-btn-uncheck"
                        onClick={() => uncheckProduct(product.id)}
                      >
                        ✕ Deshacer
                      </button>
                    </div>
                  ) : (
                    <div className="inventory-product-actions">
                      <button 
                        className="inventory-btn inventory-btn-check"
                        onClick={() => checkProduct(product.id)}
                      >
                        ✓ Check
                      </button>
                      <button 
                        className="inventory-btn"
                        onClick={() => openRechargeModal(product)}
                      >
                        + Recargar
                      </button>
                      <button 
                        className="inventory-btn"
                        onClick={() => openSetModal(product)}
                      >
                        = Establecer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {products.length === 0 && !loading && (
          <p>No hay productos disponibles</p>
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
              <button className="inventory-btn inventory-btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button 
                className="inventory-btn inventory-btn-primary" 
                onClick={handleModalSubmit}
                disabled={!modalValue || Number(modalValue) < 0}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
