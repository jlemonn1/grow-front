import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfig } from '@/context/config.context';
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
        const saleData = await getSaleById(id);
        setSale(saleData);

        // Cargar información del cliente
        try {
          const customerData = await customersService.getById(saleData.customerId);
          setCustomer(customerData);
        } catch (err) {
          console.error('Error loading customer:', err);
          // Continuar aunque no se pueda cargar el cliente
        }
      } catch (err: any) {
        if (err.status === 404) {
          setError('Venta no encontrada');
        } else {
          setError(err.message || 'Error al cargar la venta');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSale();
  }, [id]);

  const handleBack = () => {
    navigate('/sales');
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Cargando venta..." onBack={handleBack} />
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
        <PageHeader title="Venta no encontrada" onBack={handleBack} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <EmptyState
            message={error || 'La venta que buscas no existe'}
            action={{
              label: 'Volver a ventas',
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
      />

      <div className="sale-detail-container">
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
            Cliente
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
                Cliente ID: {sale.customerId}
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
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items de la venta */}
        <div className="sale-detail-section" style={{ marginBottom: 0 }}>
          <h2 className="sale-detail-section-title">
            Items de la Venta ({sale.items?.length || 0})
          </h2>
          
          {sale.items && sale.items.length > 0 ? (
            <SaleItemsTable items={sale.items} />
          ) : (
            <p className="sale-detail-info-label" style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
            }}>
              No hay items en esta venta
            </p>
          )}
        </div>
      </div>
    </>
  );
}
