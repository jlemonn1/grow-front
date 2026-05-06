import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiShoppingCart } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { type ColumnDef } from '@/components/common/DataTable';
import { CardList } from '@/components/common/CardList';
import { SaleHistoryCard } from '@/components/common/SaleHistoryCard';
import { Tabs, type Tab } from '@/components/common/Tabs';
import { CustomerSummaryTable } from '@/components/customer/CustomerSummaryTable';
import { RenewSubscriptionModal } from '@/components/customer/RenewSubscriptionModal';
import { BalanceAdjustmentModal } from '@/components/customer/BalanceAdjustmentModal';
import { BalanceTransferModal } from '@/components/customer/BalanceTransferModal';
import { BalanceHistoryTable } from '@/components/customer/BalanceHistoryTable';
import { ShowDniModal } from '@/components/customer/ShowDniModal';
import { ContractSignatureModal } from '@/components/customer/ContractSignatureModal';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { QRCodeModal } from '@/components/common/QRCodeModal';
import { CajaClosedModal } from '@/components/cajafuerte/CajaClosedModal';
import { Button } from '@/components/common/Button';
import { useUI } from '@/context/ui.context';
import { useCajaStatus } from '@/hooks/useCajaStatus';
import { useAuth } from '@/context/auth.context';
import { useDemo } from '@/context/demo.context';
import { useCustomers } from '@/context/customers.context';
import { useTicket } from '@/context/ticket.context';
import { useConfig } from '@/context/config.context';
import { customersService } from '@/services/customers.service';
import { AdminPermission } from '@/types/models';
import type { Customer, CustomerSale, CustomerSummary } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import { buildCustomerImageUrl } from '@/utils/apiUrl';
import './CustomerDetailPage.css';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { hasPermission } = useAuth();
  const { isDemoMode, demoData } = useDemo();
const { getCustomerById } = useCustomers();
  const { setCustomer: setTicketCustomer } = useTicket();
  const { config } = useConfig();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [hasLoadedSales, setHasLoadedSales] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [showTransferBalanceModal, setShowTransferBalanceModal] = useState(false);
  const [showDniModal, setShowDniModal] = useState(false);

const [showContractModal, setShowContractModal] = useState(false);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const [isClearingGuarantor, setIsClearingGuarantor] = useState(false);
  const [showClearBalanceModal, setShowClearBalanceModal] = useState(false);
  const [isClearingBalance, setIsClearingBalance] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  
  // Hook para verificar estado de caja
  const { isTodayClosed, refreshStatus: refreshCajaStatus } = useCajaStatus();
  
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
      // Resetear estados relacionados con ventas cuando cambia el cliente
      setSales([]);
      setHasLoadedSales(false);
      setSalesPagination({
        page: 0,
        size: 25,
        total: 0,
        totalPages: 0,
      });
      
      try {
        let customerData: Customer | null = null;
        
        // Si estamos en modo demo, usar datos mock del contexto
        if (isDemoMode) {
          customerData = await getCustomerById(id);
        } else {
          // Modo normal: llamar a la API
          customerData = await customersService.getById(id);
        }

        if (!customerData) {
          showToast('Socio no encontrado', 'error');
          navigate('/customers');
          return;
        }

        setCustomer(customerData);
      } catch (err) {
        if (err && typeof err === 'object' && 'status' in err) {
          const apiError = err as { status: number };
          if (apiError.status === 404) {
            showToast('Socio no encontrado', 'error');
            navigate('/customers');
            return;
          }
        }
        showToast('Error al cargar socio', 'error');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id, navigate, showToast, isDemoMode, getCustomerById]);

  // Cargar historial de ventas
  const loadSales = useCallback(async (page: number = 0) => {
    if (!id) return;

    setLoadingSales(true);
    try {
      // Si estamos en modo demo, usar datos mock
      if (isDemoMode && demoData) {
        const customerSales = demoData.sales
          .filter(sale => sale.customerId === id)
          .map(sale => ({
            id: sale.id,
            totalAmount: sale.totalAmount,
            createdAt: sale.createdAt,
            status: sale.status,
          }));

        // Simular paginación
        const size = 25;
        const start = page * size;
        const end = start + size;
        const paginatedSales = customerSales.slice(start, end);

        setSales(paginatedSales);
        setSalesPagination({
          page: page,
          size: size,
          total: customerSales.length,
          totalPages: Math.ceil(customerSales.length / size),
        });
      } else {
        // Modo normal: llamar a la API
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
      }
      setHasLoadedSales(true);
    } catch (err) {
      showToast('Error al cargar historial de dispensaciones', 'error');
      setHasLoadedSales(true);
    } finally {
      setLoadingSales(false);
    }
  }, [id, showToast, isDemoMode, demoData]);

  // Cargar resumen
  const loadSummary = useCallback(async () => {
    if (!id) return;

    setLoadingSummary(true);
    try {
      // Si estamos en modo demo, generar resumen mock
      if (isDemoMode && demoData) {
        const customerSales = demoData.sales.filter(sale => sale.customerId === id);
        const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        
        // Agrupar por producto
        const productMap = new Map<string, { totalGrams: number; totalAmount: number }>();
        customerSales.forEach(sale => {
          sale.items.forEach(item => {
            const existing = productMap.get(item.productId) || { totalGrams: 0, totalAmount: 0 };
            productMap.set(item.productId, {
              totalGrams: existing.totalGrams + item.grams,
              totalAmount: existing.totalAmount + item.lineTotal,
            });
          });
        });

        const items = Array.from(productMap.entries()).map(([productId, stats]) => {
          const product = demoData.products.find(p => p.id === productId);
          return {
            productId,
            productName: product?.name || 'Producto desconocido',
            totalGrams: stats.totalGrams,
            totalAmount: stats.totalAmount,
          };
        });

        const summaryData: CustomerSummary = {
          customerId: id,
          period: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
          },
          totalSpent,
          items,
        };
        setSummary(summaryData);
      } else {
        // Modo normal: llamar a la API
        const summaryData = await customersService.getSummary(id);
        setSummary(summaryData);
      }
    } catch (err) {
      showToast('Error al cargar resumen', 'error');
    } finally {
      setLoadingSummary(false);
    }
  }, [id, showToast, isDemoMode, demoData]);

  // Cargar datos de pestañas cuando cambian
  useEffect(() => {
    if (!customer) return;

    if (activeTab === 'history' && !hasLoadedSales && !loadingSales) {
      loadSales(0);
    } else if (activeTab === 'summary' && !summary && !loadingSummary) {
      loadSummary();
    }
  }, [activeTab, customer, hasLoadedSales, summary, loadingSales, loadingSummary, loadSales, loadSummary]);

  const handleSalesPageChange = useCallback((page: number) => {
    loadSales(page);
  }, [loadSales]);

  const handleCreateFirstSale = useCallback(() => {
    if (!customer) return;
    // Pre-cargar el cliente en el ticket
    setTicketCustomer(customer);
    // Navegar a la página de dispensación
    navigate('/sales/new');
  }, [customer, setTicketCustomer, navigate]);

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
      showToast('Socio eliminado exitosamente', 'success');
      navigate('/customers');
    } catch (err) {
      showToast('Error al eliminar socio', 'error');
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

  const handleBalanceAdjusted = () => {
    // Recargar datos del cliente
    if (id) {
      customersService.getById(id).then(setCustomer).catch(() => {
        showToast('Error al cargar datos actualizados', 'error');
      });
    }
  };

const handleBalanceTransferred = () => {
    // Recargar datos del cliente
    if (id) {
      customersService.getById(id).then(setCustomer).catch(() => {
        showToast('Error al cargar datos actualizados', 'error');
      });
    }
  };

  const handleClearBalance = async () => {
    if (!id || !customer) return;

    setIsClearingBalance(true);
    try {
      await customersService.clearBalance(id);
      showToast('Saldo vaciado exitosamente', 'success');
      // Recargar datos del cliente
      const updatedCustomer = await customersService.getById(id);
      setCustomer(updatedCustomer);
      setShowClearBalanceModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al vaciar saldo';
      showToast(errorMessage, 'error');
    } finally {
      setIsClearingBalance(false);
    }
  };

  const handleContractSigned = useCallback(async (signatureDataUrl: string) => {
    if (!customer) return;
    setIsSigningContract(true);
    try {
      const updated = await customersService.update(customer.id, {
        contractSignatureDataUrl: signatureDataUrl,
      });
      setCustomer(updated);
      showToast('Contrato firmado correctamente', 'success');
      setShowContractModal(false);
    } catch (err) {
      showToast('Error al firmar contrato', 'error');
    } finally {
      setIsSigningContract(false);
    }
  }, [customer, showToast]);

  const handleClearGuarantor = useCallback(async () => {
    if (!customer) return;
    setIsClearingGuarantor(true);
    try {
      const updated = await customersService.update(customer.id, { guarantorId: null });
      setCustomer(updated);
      showToast('Aval desvinculado', 'success');
    } catch (err) {
      showToast('Error al desvincular el aval', 'error');
    } finally {
      setIsClearingGuarantor(false);
    }
  }, [customer, showToast]);

  const isSubscriptionExpired = (): boolean => {
    if (!customer?.subscriptionEndDate) return false;
    return new Date(customer.subscriptionEndDate) < new Date();
  };

  const profileImageUrl = buildCustomerImageUrl(customer?.profilePictureUrl);
  const contractSignatureUrl = buildCustomerImageUrl(customer?.contractSignatureUrl);
  const contractReady = Boolean(
    customer?.address?.trim() &&
    customer?.estimatedMonthlyConsumptionGrams &&
    customer?.guarantorId &&
    customer?.guarantorStatus === 'AVAILABLE'
  );

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

  const enableCustomerBalance = config?.enableCustomerBalance ?? true;

  const allTabs: Tab[] = [
    {
      id: 'info',
      label: 'Información',
      content: customer ? (
        <div className="customer-info-section" data-tour="customer-tab-info">
          <div className="customer-info-header-row">
            <div className="customer-detail-avatar">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={customer.displayName}
                  className="customer-detail-avatar-image"
                />
              ) : (
                <div className="customer-avatar-placeholder">
                  {customer.displayName?.charAt(0) || 'S'}
                </div>
              )}
            </div>
            <div className="customer-detail-header-content">
              <div className="customer-detail-title-row">
                <h3>{customer.displayName}</h3>
                {customer.pin && (
                  <span className="customer-detail-pin">PIN: {customer.pin}</span>
                )}
              </div>
              <div className="customer-contract-actions">
                <Button
                  variant="primary"
                  onClick={() => setShowContractModal(true)}
                  disabled={!contractReady || isSigningContract}
                  loading={isSigningContract}
                  data-tour="sign-contract"
                >
                  {customer.contractSignatureUrl ? 'Actualizar firma' : 'Firmar contrato'}
                </Button>
              </div>
              {!contractReady && (
                <p className="contract-hint">
                  Completa dirección, consumo y aval para firmar el contrato.
                </p>
              )}
              {customer.contractSignedAt && (
                <p className="customer-contract-status">
                  Firma registrada el {formatDateTime(customer.contractSignedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="customer-info-grid">
            <div className="customer-info-item">
              <span className="customer-info-label">Dirección:</span>
              <span className="customer-info-value">
                {customer.address || 'Pendiente'}
              </span>
            </div>
            <div className="customer-info-item">
              <span className="customer-info-label">Consumo estimado:</span>
              <span className="customer-info-value">
                {customer.estimatedMonthlyConsumptionGrams
                  ? `${customer.estimatedMonthlyConsumptionGrams} g/mes`
                  : '-'}
              </span>
            </div>
            <div className="customer-info-item">
              <span className="customer-info-label">Email:</span>
              <span className="customer-info-value">{customer.email || '-'}</span>
            </div>
            <div className="customer-info-item">
              <span className="customer-info-label">Fecha de nacimiento:</span>
              <span className="customer-info-value">{customer.fechaDeNacimiento || '-'}</span>
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
            {(customer.dniPictureUrl || customer.dniNumber) && (
              <div className="customer-info-item customer-info-item-with-action">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span className="customer-info-label">DNI:</span>
                  <span className="customer-info-value">
                    {customer.dniNumber || 'Disponible'}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowDniModal(true)}
                  style={{ marginLeft: 'auto' }}
                >
                  Mostrar DNI
                </Button>
              </div>
            )}
            {customer.createdAt && (
              <div className="customer-info-item">
                <span className="customer-info-label">Fecha creación:</span>
                <span className="customer-info-value">{formatDateTime(customer.createdAt)}</span>
              </div>
            )}
            <div className="customer-info-item">
              <span className="customer-info-label">Saldo:</span>
              <span className="customer-info-value customer-balance-value">
                {formatMoney(customer.balance || 0)}
              </span>
            </div>
            <div className="customer-info-item customer-info-item-full">
              <span className="customer-info-label">Socio aval:</span>
              <div className="customer-guarantor-content">
                <span>
                  {customer.guarantorDisplayName || 'No asignado'}
                </span>
                {customer.guarantorStatus === 'UNAVAILABLE' && (
                  <span className="customer-guarantor-badge">Socio no disponible</span>
                )}
                {customer.guarantorId && (
                  <Button
                    variant="secondary"
                    onClick={handleClearGuarantor}
                    loading={isClearingGuarantor}
                    disabled={isClearingGuarantor}
                  >
                    Eliminar aval
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="customer-contract-card">
            <div className="customer-contract-card-header">
              <h3>Contrato jurado</h3>
              <span className="customer-contract-card-status">
                {customer.contractSignatureUrl ? 'Firmado' : 'Pendiente'}
              </span>
            </div>
            {contractSignatureUrl ? (
              <img
                src={contractSignatureUrl}
                alt="Firma del contrato"
                className="customer-contract-signature"
              />
            ) : (
              <p className="contract-hint">Aún no se ha registrado una firma.</p>
            )}
          </div>
<div className="customer-balance-section">
            <h3 className="customer-balance-title">Saldo</h3>
            <div className="customer-info-grid">
              <div className="customer-info-item">
                <span className="customer-info-label">Saldo actual:</span>
                <span className="customer-info-value customer-balance-value">
                  {formatMoney(customer.balance || 0)}
                </span>
              </div>
              {customer.balanceLocked && (
                <div className="customer-info-item">
                  <span className="customer-info-label">Estado:</span>
                  <span className="customer-info-value customer-balance-value" style={{ color: 'var(--color-warning)' }}>
                    Bloqueado (pendiente de vaciar)
                  </span>
                </div>
              )}
            </div>
            {!config?.enableCustomerBalance ? (
              // Saldo deshabilitado: solo mostrar Vaciar saldo si está bloqueado
              customer.balanceLocked && customer.balance && customer.balance > 0 ? (
                <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-md)' }}>
                  <Button 
                    variant="danger" 
                    onClick={() => {
                      if (isTodayClosed) {
                        setShowClosedModal(true);
                      } else {
                        setShowClearBalanceModal(true);
                      }
                    }}
                    data-tour="clear-balance"
                  >
                    Vaciar saldo ({formatMoney(customer.balance || 0)})
                  </Button>
                </div>
              ) : null
            ) : (
              // Saldo habilitado: mostrar botones de ajustar y transferir
              <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-md)' }}>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    if (isTodayClosed) {
                      setShowClosedModal(true);
                    } else {
                      setShowAdjustBalanceModal(true);
                    }
                  }}
                  data-tour="adjust-balance"
                >
                  Ajustar saldo
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    if (isTodayClosed) {
                      setShowClosedModal(true);
                    } else {
                      setShowTransferBalanceModal(true);
                    }
                  }}
                  data-tour="transfer-balance"
                >
                  Transferir saldo
                </Button>
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
                <Button variant="primary" onClick={handleRenewSubscription} data-tour="renew-subscription">
                  Renovar suscripción
                </Button>
              </div>
            )}
          </div>
            {hasPermission(AdminPermission.GESTIONAR_CLIENTES) && (
              <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
                <Button variant="primary" onClick={() => navigate(`/customers/${id}/edit`)}>
                  Editar socio
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Eliminar socio
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
        <div className="customer-history-section" data-tour="purchase-history">
          {loadingSales ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
              <Spinner size="lg" />
            </div>
          ) : hasLoadedSales && sales.length === 0 ? (
            <EmptyState
              message="Este socio aún no tiene pedidos registrados"
              icon={<HiShoppingCart />}
              action={{
                label: 'Crear primera dispensación',
                onClick: handleCreateFirstSale,
              }}
            />
          ) : (
            <CardList
              columns={salesColumns}
              data={sales}
              loading={false}
              pagination={{
                page: salesPagination.page,
                size: salesPagination.size,
                total: salesPagination.total,
                totalPages: salesPagination.totalPages,
              }}
              onPageChange={handleSalesPageChange}
              onRowClick={(sale) => navigate(`/sales/${sale.id}`)}
              emptyMessage="No hay dispensaciones registradas para este socio"
              renderCard={(sale, isExpanded, onToggleExpand) => (
                <SaleHistoryCard
                  sale={sale}
                  isExpanded={isExpanded}
                  onToggleExpand={onToggleExpand}
                  onClick={(sale) => navigate(`/sales/${sale.id}`)}
                />
              )}
            />
          )}
        </div>
      ),
    },
    {
      id: 'summary',
      label: 'Resumen',
      content: (
        <div className="customer-summary-section" data-tour="customer-summary">
          <CustomerSummaryTable summary={summary} loading={loadingSummary} />
        </div>
      ),
    },
{
      id: 'balance-history',
      label: 'Historial de Saldo',
      content: customer ? (
        <div className="customer-balance-history-section" data-tour="balance-history">
          <BalanceHistoryTable customerId={customer.id} />
        </div>
      ) : null,
    },
  ];

  // Filtrar pestañas según configuración
  const tabs = enableCustomerBalance ? allTabs : allTabs.filter(tab => tab.id !== 'balance-history');

  if (loading) {
    return (
      <>
        <PageHeader title="Cargando socio..." onBack={handleBack} />
        <div className="customer-detail-container">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <PageHeader title="Socio no encontrado" onBack={handleBack} />
        <div className="customer-detail-container">
          <EmptyState
            message="El socio que buscas no existe"
            action={{
              label: 'Volver a socios',
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
        subtitle="Perfil de socio"
        onBack={handleBack}
        dataTourBack="back-to-customers"
      />
      <div className="customer-detail-container" data-tour="customer-detail">
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
          title="Eliminar socio"
          message="¿Estás seguro de que deseas eliminar el socio"
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

      {showAdjustBalanceModal && customer && (
        <BalanceAdjustmentModal
          isOpen={showAdjustBalanceModal}
          onClose={() => setShowAdjustBalanceModal(false)}
          customer={customer}
          onAdjusted={handleBalanceAdjusted}
        />
      )}

      {showTransferBalanceModal && customer && (
        <BalanceTransferModal
          isOpen={showTransferBalanceModal}
          onClose={() => setShowTransferBalanceModal(false)}
          customer={customer}
          onTransferred={handleBalanceTransferred}
        />
      )}

      {showDniModal && customer && (
        <ShowDniModal
          isOpen={showDniModal}
          onClose={() => setShowDniModal(false)}
          customer={customer}
        />
      )}


{showContractModal && customer && (
        <ContractSignatureModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          onSigned={handleContractSigned}
          isSaving={isSigningContract}
        />
      )}

      {showClearBalanceModal && customer && (
        <ConfirmDeleteModal
          isOpen={showClearBalanceModal}
          onClose={() => !isClearingBalance && setShowClearBalanceModal(false)}
          onConfirm={handleClearBalance}
          title="Vaciar saldo"
          message={`¿Estás seguro de que deseas vaciar el saldo de ${formatMoney(customer.balance || 0)} de ${customer.displayName}? Esta acción no se puede deshacer.`}
          itemName={`Vaciar saldo de ${customer.displayName}`}
          confirmLabel="Vaciar saldo"
          isDeleting={isClearingBalance}
          variant="danger"
        />
      )}

      <CajaClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
      />
    </>
  );
}
