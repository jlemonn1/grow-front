import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Input';
import { CardList } from '@/components/common/CardList';
import { CustomerCard } from '@/components/common/CustomerCard';
import { CustomerAvatar } from '@/components/common/CustomerAvatar';
import { type ColumnDef } from '@/components/common/DataTable';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Button } from '@/components/common/Button';
import { useCustomers } from '@/hooks/useCustomers';
import { useUI } from '@/context/ui.context';
import { useVisitor } from '@/context/visitor.context';
import { useAuth } from '@/context/auth.context';
import { useDemo } from '@/context/demo.context';
import { AdminPermission } from '@/types/models';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/models';
import type { PageResponse } from '@/types/api';
import { formatDateTime } from '@/utils/dates';
import { formatMoney } from '@/utils/money';
import { HiPhone, HiKey, HiUser, HiIdentification } from 'react-icons/hi';
import './CustomersPage.css';

type SearchType = 'name' | 'phone' | 'pin' | 'dni' | 'any';
type SearchMode = 'auto' | 'manual';

export function CustomersPage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { isVisitorMode } = useVisitor();
  const { hasPermission } = useAuth();
  const { isDemoMode } = useDemo();
  
  // Siempre llamar al hook (requisito de React)
  const customersContext = useCustomers();
  
  // Usar valores del contexto solo si no estamos en modo visitante
  const contextCustomers = isVisitorMode ? [] : customersContext.customers;
  const contextLoading = isVisitorMode ? false : customersContext.loading;
  const contextError = isVisitorMode ? null : customersContext.error;
  const contextPagination = isVisitorMode ? { page: 0, size: 25, total: 0, totalPages: 0 } : customersContext.pagination;
  const loadCustomers = isVisitorMode ? (() => Promise.resolve()) : customersContext.loadCustomers;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('auto');
  const [manualSearchType, setManualSearchType] = useState<SearchType | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; customer: Customer | null }>({
    isOpen: false,
    customer: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado para modo visitante
  const [visitorCustomers, setVisitorCustomers] = useState<Customer[]>([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);
  const [visitorPagination, setVisitorPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  // Usar datos según el modo
  const customers = isVisitorMode ? visitorCustomers : contextCustomers;
  const loading = isVisitorMode ? visitorLoading : contextLoading;
  const error = isVisitorMode ? visitorError : contextError;
  const pagination = isVisitorMode ? visitorPagination : contextPagination;

  // Cargar clientes (públicos o normales según el modo)
  const loadCustomersData = useCallback(async (params?: { q?: string; type?: SearchType; page?: number; size?: number }) => {
    if (isVisitorMode) {
      setVisitorLoading(true);
      setVisitorError(null);
      try {
        const response: PageResponse<Customer> = await customersService.searchPublic(params);
        setVisitorCustomers(response.content);
        setVisitorPagination({
          page: response.number,
          size: response.size,
          total: response.totalElements,
          totalPages: response.totalPages,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar socios';
        setVisitorError(errorMessage);
        setVisitorCustomers([]);
      } finally {
        setVisitorLoading(false);
      }
    } else {
      loadCustomers(params);
    }
  }, [isVisitorMode, loadCustomers]);

  // Detectar tipo de búsqueda automática
  const getAutoSearchType = (query: string): SearchType => {
    if (query.length < 3) return 'any';
    
    const trimmed = query.trim();
    const isAllNumbers = /^\d+$/.test(trimmed);
    const isAllLetters = /^[a-zA-Z]+$/.test(trimmed);
    const hasNumbersAndLetters = /[0-9]/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
    
    if (isAllNumbers) {
      return 'phone';
    } else if (isAllLetters) {
      return 'name';
    } else if (hasNumbersAndLetters && trimmed.length <= 4) {
      return 'pin';
    }
    
    return 'any';
  };

  // Manejar clic en chips
  const handleChipClick = useCallback((type: SearchType) => {
    if (searchMode === 'manual' && manualSearchType === type) {
      setSearchMode('auto');
      setManualSearchType(null);
    } else {
      setSearchMode('manual');
      setManualSearchType(type);
    }
  }, [searchMode, manualSearchType]);

  const handleClearFilter = useCallback(() => {
    setSearchMode('auto');
    setManualSearchType(null);
  }, []);

  // Cargar clientes al montar
  useEffect(() => {
    // Si estamos en modo demo o modo normal, cargar datos
    if (!isVisitorMode) {
      loadCustomersData({ page: 0, size: 25 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisitorMode, isDemoMode]); // Incluir isDemoMode para recargar cuando se active el modo demo

  // Debounce para búsqueda - solo buscar si hay 3+ caracteres
  useEffect(() => {
    if (searchQuery.length < 3 && searchQuery.length > 0) {
      // Si hay menos de 3 caracteres, no buscar
      return;
    }

    // Determinar tipo de búsqueda
    let finalSearchType: SearchType;
    if (searchMode === 'manual' && manualSearchType) {
      finalSearchType = manualSearchType;
    } else {
      finalSearchType = getAutoSearchType(searchQuery);
    }
    setSearchType(finalSearchType);

    const timer = setTimeout(() => {
      loadCustomersData({ 
        q: searchQuery || undefined, 
        type: finalSearchType === 'any' ? undefined : finalSearchType,
        page: 0, 
        size: 25 
      });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchMode, manualSearchType]);

  const handlePageChange = useCallback((page: number) => {
    loadCustomersData({ q: searchQuery || undefined, page, size: 25 });
  }, [searchQuery, loadCustomersData]);

  const handleRowClick = useCallback((customer: Customer) => {
    // En modo visitante, no permitir navegar a detalles
    if (isVisitorMode) {
      return;
    }
    navigate(`/customers/${customer.id}`);
  }, [navigate, isVisitorMode]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, customer });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.customer) return;

    setIsDeleting(true);
    try {
      await customersService.delete(deleteModal.customer.id);
      showToast('Socio eliminado exitosamente', 'success');
      setDeleteModal({ isOpen: false, customer: null });
      // Recargar clientes
      loadCustomersData({ q: searchQuery || undefined, page: 0, size: 25 });
    } catch (err) {
      showToast('Error al eliminar socio', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.customer, showToast, loadCustomers, searchQuery]);

  const handleCloseDeleteModal = useCallback(() => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, customer: null });
    }
  }, [isDeleting]);

  const columns: ColumnDef<Customer>[] = [
    {
      header: 'Nombre',
      accessor: 'displayName',
      cell: (value, row) => (
        <div className="customers-table-name-cell">
          <CustomerAvatar
            name={row.displayName}
            imageUrl={row.profilePictureUrl}
            size={36}
            className="customers-table-avatar"
            tooltip={`Foto de ${row.displayName}`}
          />
          <span className="customers-table-name-text">{value}</span>
        </div>
      ),
    },
    {
      header: 'PIN',
      accessor: 'pin',
      cell: (value) => value || '-',
    },
    {
      header: 'Teléfono',
      accessor: 'phone',
      cell: (value) => value || '-',
    },
    {
      header: 'Notas',
      accessor: 'notes',
      cell: (value) => value || '-',
    },
    {
      header: 'Saldo',
      accessor: 'balance',
      cell: (value) => value !== undefined ? formatMoney(value) : formatMoney(0),
    },
    {
      header: 'Fecha creación',
      accessor: 'createdAt',
      cell: (value) => value ? formatDateTime(value) : '-',
    },
    ...(isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_CLIENTES) ? [] : [{
      header: 'Acciones',
      accessor: (row: Customer) => (
        <Button
          variant="danger"
          onClick={(e) => handleDeleteClick(e, row)}
          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}
        >
          Eliminar
        </Button>
      ),
    }]),
  ];

  return (
    <>
      <PageHeader
        title="Socios"
        action={!isVisitorMode && hasPermission(AdminPermission.GESTIONAR_CLIENTES) ? {
          label: '+ Nuevo socio',
          onClick: () => navigate('/customers/new'),
          dataTour: 'create-customer',
        } : undefined}
      />
      
      <div className="customers-page-container" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="customers-page-search">
          {/* Chips de selección de tipo de búsqueda */}
          <div className="customers-page-chips">
            <button
              type="button"
              className={`customers-page-chip ${searchType === 'pin' || (searchMode === 'manual' && manualSearchType === 'pin') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'pin' ? 'manual' : ''}`}
              onClick={() => handleChipClick('pin')}
            >
              <HiKey />
              <span>PIN</span>
            </button>
            <button
              type="button"
              className={`customers-page-chip ${searchType === 'name' || (searchMode === 'manual' && manualSearchType === 'name') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'name' ? 'manual' : ''}`}
              onClick={() => handleChipClick('name')}
            >
              <HiUser />
              <span>Nombre</span>
            </button>
            <button
              type="button"
              className={`customers-page-chip ${searchType === 'phone' || (searchMode === 'manual' && manualSearchType === 'phone') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'phone' ? 'manual' : ''}`}
              onClick={() => handleChipClick('phone')}
            >
              <HiPhone />
              <span>Teléfono</span>
            </button>
            <button
              type="button"
              className={`customers-page-chip ${searchType === 'dni' || (searchMode === 'manual' && manualSearchType === 'dni') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'dni' ? 'manual' : ''}`}
              onClick={() => handleChipClick('dni')}
            >
              <HiIdentification />
              <span>DNI</span>
            </button>
            {searchMode === 'manual' && (
              <button
                type="button"
                className="customers-page-chip-clear"
                onClick={handleClearFilter}
                aria-label="Quitar filtro y volver a automático"
                title="Quitar filtro y volver a automático"
              >
                ×
              </button>
            )}
          </div>
          
          <Input
            type="text"
            placeholder="Buscar por nombre, PIN o teléfono (mín. 3 caracteres)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '400px', width: '100%' }}
            data-tour="customer-search"
          />
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <div className="customers-page-search-hint">
              Escribe al menos 3 caracteres para buscar
            </div>
          )}
          {searchQuery.length >= 3 && (
            <div className="customers-page-search-hint">
              Buscando: {searchType === 'name' ? 'por nombre' : 
                        searchType === 'phone' ? 'por teléfono' :
                        searchType === 'pin' ? 'por PIN' :
                        searchType === 'dni' ? 'por DNI' : 'en todos los campos'}
              {searchMode === 'manual' && ' (manual)'}
            </div>
          )}
        </div>

        {error && (
          <div className="customers-page-error">
            {error}
          </div>
        )}

        <div data-tour="customers-list">
          <CardList
            columns={columns}
            data={customers}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onRowClick={isVisitorMode ? undefined : handleRowClick}
            onDelete={isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_CLIENTES) ? undefined : ((customer) => {
              setDeleteModal({ isOpen: true, customer });
            })}
            emptyMessage="No hay socios disponibles"
            renderCard={(customer, isExpanded, onToggleExpand) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                onClick={isVisitorMode ? undefined : handleRowClick}
                onDelete={isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_CLIENTES) ? undefined : ((c) => {
                  setDeleteModal({ isOpen: true, customer: c });
                })}
              />
            )}
          />
        </div>
      </div>

      {deleteModal.isOpen && deleteModal.customer && (
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Eliminar socio"
          message="¿Estás seguro de que deseas eliminar el socio"
          itemName={deleteModal.customer.displayName}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
