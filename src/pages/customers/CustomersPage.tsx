import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Input';
import { CardList } from '@/components/common/CardList';
import { CustomerCard } from '@/components/common/CustomerCard';
import { type ColumnDef } from '@/components/common/DataTable';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Button } from '@/components/common/Button';
import { useCustomers } from '@/hooks/useCustomers';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './CustomersPage.css';

export function CustomersPage() {
  const navigate = useNavigate();
  const { customers, loading, error, pagination, loadCustomers } = useCustomers();
  const { showToast } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; customer: Customer | null }>({
    isOpen: false,
    customer: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Detectar tipo de búsqueda
  const getSearchType = (query: string): 'name' | 'phone' | 'pin' | 'any' => {
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

  // Cargar clientes al montar
  useEffect(() => {
    loadCustomers({ page: 0, size: 25 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce para búsqueda - solo buscar si hay 3+ caracteres
  useEffect(() => {
    if (searchQuery.length < 3 && searchQuery.length > 0) {
      // Si hay menos de 3 caracteres, no buscar
      return;
    }

    const timer = setTimeout(() => {
      loadCustomers({ q: searchQuery || undefined, page: 0, size: 25 });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handlePageChange = useCallback((page: number) => {
    loadCustomers({ q: searchQuery || undefined, page, size: 25 });
  }, [searchQuery, loadCustomers]);

  const handleRowClick = useCallback((customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, customer });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.customer) return;

    setIsDeleting(true);
    try {
      await customersService.delete(deleteModal.customer.id);
      showToast('Cliente eliminado exitosamente', 'success');
      setDeleteModal({ isOpen: false, customer: null });
      // Recargar clientes
      loadCustomers({ q: searchQuery || undefined, page: 0, size: 25 });
    } catch (err) {
      showToast('Error al eliminar cliente', 'error');
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
      header: 'Fecha creación',
      accessor: 'createdAt',
      cell: (value) => value ? formatDateTime(value) : '-',
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value, row) => (
        <Button
          variant="danger"
          onClick={(e) => handleDeleteClick(e, row)}
          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}
        >
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        action={{
          label: '+ Nuevo cliente',
          onClick: () => navigate('/customers/new'),
        }}
      />
      
      <div className="customers-page-container" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="customers-page-search">
          <Input
            type="text"
            placeholder="Buscar por nombre, PIN o teléfono (mín. 3 caracteres)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '400px', width: '100%' }}
          />
          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <div className="customers-page-search-hint">
              Escribe al menos 3 caracteres para buscar
            </div>
          )}
          {searchQuery.length >= 3 && (
            <div className="customers-page-search-hint">
              Buscando: {getSearchType(searchQuery) === 'name' ? 'por nombre' : 
                        getSearchType(searchQuery) === 'phone' ? 'por teléfono' :
                        getSearchType(searchQuery) === 'pin' ? 'por PIN' : 'en todos los campos'}
            </div>
          )}
        </div>

        {error && (
          <div className="customers-page-error">
            {error}
          </div>
        )}

        <CardList
          columns={columns}
          data={customers}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onDelete={(customer) => {
            setDeleteModal({ isOpen: true, customer });
          }}
          emptyMessage="No hay clientes disponibles"
          renderCard={(customer, isExpanded, onToggleExpand) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onClick={handleRowClick}
              onDelete={(c) => {
                setDeleteModal({ isOpen: true, customer: c });
              }}
            />
          )}
        />
      </div>

      {deleteModal.isOpen && deleteModal.customer && (
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Eliminar cliente"
          message="¿Estás seguro de que deseas eliminar el cliente"
          itemName={deleteModal.customer.displayName}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
