import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfig } from '@/context/config.context';
import { useDemo } from '@/context/demo.context';
import { useCustomers } from '@/context/customers.context';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SaleItemsTable } from '@/components/sale/SaleItemsTable';
import { getSaleById } from '@/services/sales.service';
import { customersService } from '@/services/customers.service';
import type { Sale, Customer } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './SaleDetailPage.css';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { isDemoMode, demoData } = useDemo();
  const { getCustomerById } = useCustomers();
  const showCashDetails = config?.showCashDetails ?? true;
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSale = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        let saleData: Sale | null = null;

        // Si estamos en modo demo, usar datos mock
        if (isDemoMode && demoData) {
          saleData = demoData.sales.find(s => s.id === id) || null;
        } else {
          // Modo normal: llamar a la API
          saleData = await getSaleById(id);
        }

        if (!saleData) {
          setError('Dispensación no encontrada');
          setLoading(false);
          return;
        }

        setSale(saleData);

        // Cargar información del cliente
        try {
          let customerData: Customer | null = null;
          
          // Si estamos en modo demo, usar datos mock
          if (isDemoMode) {
            customerData = await getCustomerById(saleData.customerId);
          } else {
            // Modo normal: llamar a la API
            customerData = await customersService.getById(saleData.customerId);
          }
          
          setCustomer(customerData);
        } catch (err) {
          console.error('Error loading customer:', err);
          // Continuar aunque no se pueda cargar el cliente
        }
      } catch (err: any) {
        if (err.status === 404) {
          setError('Dispensación no encontrada');
        } else {
          setError(err.message || 'Error al cargar la dispensación');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSale();
  }, [id, isDemoMode, demoData, getCustomerById]);

  const handleBack = () => {
    navigate('/sales');
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Cargando dispensación..." onBack={handleBack} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (error || !sale) {
    return (
      <>
        <PageHeader title="Dispensación no encontrada" onBack={handleBack} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <EmptyState
            message={error || 'La dispensación que buscas no existe'}
            action={{
              label: 'Volver a dispensaciones',
              onClick: () => navigate('/sales'),
            }}
          />
        </div>
      </>
    );
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <>
      <PageHeader
        title={`Venta #${sale.id.substring(0, 8)}...`}
        onBack={handleBack}
        dataTourBack="back-to-sales"
      />

      <div className="sale-detail-container" data-tour="sale-detail">
        {/* Información general */}
        <div className="sale-detail-section">
          <h2 className="sale-detail-section-title">
            Información General
          </h2>
          
          <div className="sale-detail-info-grid">
            <div className="sale-detail-info-item">
              <span className="sale-detail-info-label">
                ID de Venta
              </span>
              <span className="sale-detail-info-value sale-detail-info-value-monospace">
                {sale.id}
              </span>
            </div>

            <div className="sale-detail-info-item">
              <span className="sale-detail-info-label">
                Fecha y Hora
              </span>
              <span className="sale-detail-info-value">
                {formatDateTime(sale.createdAt)}
              </span>
            </div>

            <div className="sale-detail-info-item">
              <span className="sale-detail-info-label">
                Estado
              </span>
              <span className={`sale-detail-status-badge ${
                sale.status === 'COMPLETED' 
                  ? 'sale-detail-status-completed' 
                  : sale.status === 'CANCELLED' 
                  ? 'sale-detail-status-cancelled' 
                  : ''
              }`}>
                {getStatusLabel(sale.status)}
              </span>
            </div>

            {(sale.createdByUsername || sale.createdBy?.username) && (
              <div className="sale-detail-info-item">
                <span className="sale-detail-info-label">
                  Realizado por
                </span>
                <span className="sale-detail-info-value">
                  {sale.createdByUsername || sale.createdBy?.username}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Información del cliente */}
        <div className="sale-detail-section">
          <h2 className="sale-detail-section-title">
            Socio
          </h2>
          
          {customer ? (
            <div>
              <button
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="sale-detail-customer-link"
              >
                {customer.displayName}
              </button>
              {customer.phone && (
                <p className="sale-detail-info-label" style={{ marginTop: 'var(--spacing-xs)' }}>
                  Teléfono: {customer.phone}
                </p>
              )}
            </div>
          ) : (
            <div>
              <span className="sale-detail-info-value sale-detail-info-value-monospace">
                Socio ID: {sale.customerId}
              </span>
            </div>
          )}
        </div>

        {/* Resumen financiero */}
        <div className="sale-detail-section">
          <h2 className="sale-detail-section-title">
            Resumen Financiero
          </h2>
          
          <div className="sale-detail-info-grid">
            {(sale.totalBeforeDiscount !== undefined && sale.totalBeforeDiscount !== null) && (
              <div className="sale-detail-info-item">
                <span className="sale-detail-info-label">
                  Subtotal
                </span>
                <span className="sale-detail-info-value" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>
                  {formatMoney(sale.totalBeforeDiscount)}
                </span>
              </div>
            )}

            {(sale.discountAmount !== undefined && sale.discountAmount !== null && sale.discountAmount > 0) && (
              <div className="sale-detail-info-item">
                <span className="sale-detail-info-label">
                  Descuento
                  {(sale.couponCode || sale.manualDiscountPercent) ? (
                    <span style={{ marginLeft: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                      {sale.couponCode ? `(Cupón: ${sale.couponCode})` : sale.manualDiscountPercent ? `(Manual: ${sale.manualDiscountPercent}%)` : ''}
                    </span>
                  ) : null}
                </span>
                <span className="sale-detail-info-value" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-error)' }}>
                  -{formatMoney(sale.discountAmount)}
                </span>
              </div>
            )}

            <div className="sale-detail-info-item">
              <span className="sale-detail-info-label">
                Total
              </span>
              <span className="sale-detail-total-amount">
                {formatMoney(sale.totalAmount)}
              </span>
            </div>

            {showCashDetails && (
              <>
                <div className="sale-detail-info-item">
                  <span className="sale-detail-info-label">
                    Efectivo Recibido
                  </span>
                  <span className="sale-detail-info-value" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>
                    {formatMoney(sale.cashGiven)}
                  </span>
                </div>

                <div className="sale-detail-info-item">
                  <span className="sale-detail-info-label">
                    Cambio
                  </span>
                  <span className="sale-detail-info-value" style={{ fontSize: 'var(--font-size-lg)', fontWeight: 500 }}>
                    {formatMoney(sale.changeAmount)}
                  </span>
                  {sale.changeSavedToBalance && sale.changeSavedToBalance > 0 && (
                    <span className="sale-detail-info-label" style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-success)',
                      marginTop: 'var(--spacing-xs)',
                      display: 'block'
                    }}>
                      (Guardado en saldo: {formatMoney(sale.changeSavedToBalance)})
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Información de saldo */}
            {(sale.balanceUsed && sale.balanceUsed > 0) || (sale.changeSavedToBalance && sale.changeSavedToBalance > 0) ? (
              <div className="sale-detail-info-item" style={{ 
                gridColumn: '1 / -1',
                marginTop: 'var(--spacing-md)',
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid var(--border-color)'
              }}>
                <span className="sale-detail-info-label" style={{ 
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 600,
                  marginBottom: 'var(--spacing-sm)',
                  display: 'block'
                }}>
                  Información de Saldo
                </span>
                {sale.balanceUsed && sale.balanceUsed > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                    <span className="sale-detail-info-label">
                      Saldo usado:
                    </span>
                    <span className="sale-detail-info-value" style={{ 
                      fontSize: 'var(--font-size-base)', 
                      fontWeight: 500,
                      color: 'var(--color-primary)',
                      marginLeft: 'var(--spacing-xs)'
                    }}>
                      {formatMoney(sale.balanceUsed)}
                    </span>
                  </div>
                )}
                {sale.changeSavedToBalance && sale.changeSavedToBalance > 0 && (
                  <div>
                    <span className="sale-detail-info-label">
                      Cambio guardado en saldo:
                    </span>
                    <span className="sale-detail-info-value" style={{ 
                      fontSize: 'var(--font-size-base)', 
                      fontWeight: 500,
                      color: 'var(--color-success)',
                      marginLeft: 'var(--spacing-xs)'
                    }}>
                      {formatMoney(sale.changeSavedToBalance)}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Items de la dispensación */}
        <div className="sale-detail-section" style={{ marginBottom: 0 }}>
          <h2 className="sale-detail-section-title">
            Items de la Dispensación ({sale.items?.length || 0})
          </h2>
          
          {sale.items && sale.items.length > 0 ? (
            <SaleItemsTable items={sale.items} />
          ) : (
            <p className="sale-detail-info-label" style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
            }}>
              No hay items en esta dispensación
            </p>
          )}
        </div>
      </div>
    </>
  );
}
