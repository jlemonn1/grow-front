import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { type ColumnDef } from '@/components/common/DataTable';
import { CardList } from '@/components/common/CardList';
import { SaleHistoryCard } from '@/components/common/SaleHistoryCard';
import { Tabs, type Tab } from '@/components/common/Tabs';
import { CustomerSummaryTable } from '@/components/customer/CustomerSummaryTable';
import { RenewSubscriptionModal } from '@/components/customer/RenewSubscriptionModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { QRCodeModal } from '@/components/common/QRCodeModal';
import { Button } from '@/components/common/Button';
import { useUI } from '@/context/ui.context';
import { useAuth } from '@/context/auth.context';
import { customersService } from '@/services/customers.service';
import { AdminPermission } from '@/types/models';
import type { Customer, CustomerSale, CustomerSummary } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './CustomerDetailPage.css';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { hasPermission } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [salesPagination, setSalesPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  // Cargar datos del cliente
  useEffect(() => {
    const loadCustomer = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const customerData = await customersService.getById(id);
        setCustomer(customerData);
      } catch (err) {
        if (err && typeof err === 'object' && 'status' in err) {
          const apiError = err as { status: number };
          if (apiError.status === 404) {
            showToast('Cliente no encontrado', 'error');
            navigate('/customers');
            return;
          }
        }
        showToast('Error al cargar cliente', 'error');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id, navigate, showToast]);

  // Cargar historial de ventas
  const loadSales = useCallback(async (page: number = 0) => {
    if (!id) return;

    setLoadingSales(true);
    try {
      const response = await customersService.getSales(id, {
        page,
        size: 25,
      });
      setSales(response.content);
      setSalesPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      showToast('Error al cargar historial de ventas', 'error');
    } finally {
      setLoadingSales(false);
    }
  }, [id, showToast]);

  // Cargar resumen
  const loadSummary = useCallback(async () => {
    if (!id) return;

    setLoadingSummary(true);
    try {
      const summaryData = await customersService.getSummary(id);
      setSummary(summaryData);
    } catch (err) {
      showToast('Error al cargar resumen', 'error');
    } finally {
      setLoadingSummary(false);
    }
  }, [id, showToast]);

  // Cargar datos de pestañas cuando cambian
  useEffect(() => {
    if (!customer) return;

    if (activeTab === 'history' && (!sales || sales.length === 0) && !loadingSales) {
      loadSales(0);
    } else if (activeTab === 'summary' && !summary && !loadingSummary) {
      loadSummary();
    }
  }, [activeTab, customer, sales, summary, loadingSales, loadingSummary, loadSales, loadSummary]);

  const handleSalesPageChange = useCallback((page: number) => {
    loadSales(page);
  }, [loadSales]);

  const handleBack = () => {
    navigate('/customers');
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!id || !customer) return;

    setIsDeleting(true);
    try {
      await customersService.delete(id);
      showToast('Cliente eliminado exitosamente', 'success');
      navigate('/customers');
    } catch (err) {
      showToast('Error al eliminar cliente', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  const handleRenewSubscription = () => {
    setShowRenewModal(true);
  };

  const handleSubscriptionRenewed = () => {
    // Recargar datos del cliente
    if (id) {
      customersService.getById(id).then(setCustomer).catch(() => {
        showToast('Error al cargar datos actualizados', 'error');
      });
    }
    setShowRenewModal(false);
  };

  const isSubscriptionExpired = (): boolean => {
    if (!customer?.subscriptionEndDate) return false;
    return new Date(customer.subscriptionEndDate) < new Date();
  };

  const salesColumns: ColumnDef<CustomerSale>[] = [
    {
      header: 'Fecha',
      accessor: 'createdAt',
      cell: (value) => formatDateTime(value as string),
    },
    {
      header: 'Total',
      accessor: 'totalAmount',
      cell: (value) => formatMoney(value as number),
    },
    {
      header: 'Estado',
      accessor: 'status',
      cell: (value) => {
        const status = value as string;
        return (
          <span className={`sale-status sale-status-${status.toLowerCase()}`}>
            {status}
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (_value, row) => (
        <Link
          to={`/sales/${row.id}`}
          className="sale-link"
        >
          Ver detalle
        </Link>
      ),
    },
  ];

  const tabs: Tab[] = [
    {
      id: 'info',
      label: 'Información',
      content: customer ? (
        <div className="customer-info-section">
          <div className="customer-info-grid">
            <div className="customer-info-item">
              <span className="customer-info-label">Nombre:</span>
              <span className="customer-info-value">{customer.displayName}</span>
            </div>
            {customer.phone && (
              <div className="customer-info-item">
                <span className="customer-info-label">Teléfono:</span>
                <span className="customer-info-value">{customer.phone}</span>
              </div>
            )}
            {customer.notes && (
              <div className="customer-info-item customer-info-item-full">
                <span className="customer-info-label">Notas:</span>
                <span className="customer-info-value">{customer.notes}</span>
              </div>
            )}
            {customer.pin && (
              <div className="customer-info-item customer-info-item-with-action">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span className="customer-info-label">PIN:</span>
                  <span className="customer-info-value">{customer.pin}</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowQRModal(true)}
                  style={{ marginLeft: 'auto' }}
                >
                  Generar QR
                </Button>
              </div>
            )}
            {customer.createdAt && (
              <div className="customer-info-item">
                <span className="customer-info-label">Fecha creación:</span>
                <span className="customer-info-value">{formatDateTime(customer.createdAt)}</span>
              </div>
            )}
          </div>
          <div className="customer-subscription-section">
            <h3 className="customer-subscription-title">Suscripción</h3>
            <div className="customer-info-grid">
              <div className="customer-info-item">
                <span className="customer-info-label">Tipo:</span>
                <span className="customer-info-value">
                  {customer.subscriptionType === 'MONTHLY' ? 'Mensual' : 'Anual'}
                </span>
              </div>
              <div className="customer-info-item">
                <span className="customer-info-label">Precio:</span>
                <span className="customer-info-value">{formatMoney(customer.subscriptionPrice)}</span>
              </div>
              <div className="customer-info-item">
                <span className="customer-info-label">Fecha inicio:</span>
                <span className="customer-info-value">{formatDateTime(customer.subscriptionStartDate)}</span>
              </div>
              <div className="customer-info-item">
                <span className="customer-info-label">Fecha expiración:</span>
                <span className={`customer-info-value ${isSubscriptionExpired() ? 'subscription-expired' : ''}`}>
                  {formatDateTime(customer.subscriptionEndDate)}
                  {isSubscriptionExpired() && ' (Expirada)'}
                </span>
              </div>
              <div className="customer-info-item">
                <span className="customer-info-label">Estado:</span>
                <span className={`customer-info-value ${isSubscriptionExpired() ? 'subscription-expired' : 'subscription-active'}`}>
                  {isSubscriptionExpired() ? 'Expirada' : 'Activa'}
                </span>
              </div>
            </div>
            {hasPermission(AdminPermission.GESTIONAR_CLIENTES) && (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <Button variant="primary" onClick={handleRenewSubscription}>
                  Renovar suscripción
                </Button>
              </div>
            )}
          </div>
          {hasPermission(AdminPermission.GESTIONAR_CLIENTES) && (
            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
              <Button variant="danger" onClick={handleDelete}>
                Eliminar cliente
              </Button>
            </div>
          )}
        </div>
      ) : null,
    },
    {
      id: 'history',
      label: 'Historial',
      content: (
        <div className="customer-history-section">
          <CardList
            columns={salesColumns}
            data={sales}
            loading={loadingSales}
            pagination={{
              page: salesPagination.page,
              size: salesPagination.size,
              total: salesPagination.total,
              totalPages: salesPagination.totalPages,
            }}
            onPageChange={handleSalesPageChange}
            onRowClick={(sale) => navigate(`/sales/${sale.id}`)}
            emptyMessage="No hay ventas registradas para este cliente"
            renderCard={(sale, isExpanded, onToggleExpand) => (
              <SaleHistoryCard
                sale={sale}
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                onClick={(sale) => navigate(`/sales/${sale.id}`)}
              />
            )}
          />
        </div>
      ),
    },
    {
      id: 'summary',
      label: 'Resumen',
      content: (
        <div className="customer-summary-section">
          <CustomerSummaryTable summary={summary} loading={loadingSummary} />
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title="Cargando cliente..." onBack={handleBack} />
        <div className="customer-detail-container">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <PageHeader title="Cliente no encontrado" onBack={handleBack} />
        <div className="customer-detail-container">
          <EmptyState
            message="El cliente que buscas no existe"
            action={{
              label: 'Volver a clientes',
              onClick: () => navigate('/customers'),
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={customer.displayName}
        subtitle="Perfil de cliente"
        onBack={handleBack}
      />
      <div className="customer-detail-container">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {showDeleteModal && customer && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Eliminar cliente"
          message="¿Estás seguro de que deseas eliminar el cliente"
          itemName={customer.displayName}
          isDeleting={isDeleting}
        />
      )}

      {showRenewModal && customer && (
        <RenewSubscriptionModal
          isOpen={showRenewModal}
          onClose={() => setShowRenewModal(false)}
          customer={customer}
          onRenewed={handleSubscriptionRenewed}
        />
      )}

      {showQRModal && customer && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          customer={customer}
        />
      )}
    </>
  );
}
