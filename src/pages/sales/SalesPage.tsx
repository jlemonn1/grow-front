import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiFilter, HiViewGrid, HiCollection } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { type ColumnDef } from '@/components/common/DataTable';
import { CardList } from '@/components/common/CardList';
import { SaleCard } from '@/components/common/SaleCard';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { Select, type SelectOption } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { listSales } from '@/services/sales.service';
import { customersService } from '@/services/customers.service';
import { useCustomerNames } from '@/hooks/useCustomerNames';
import type { Sale, Customer } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import type { PageResponse } from '@/types/api';
import { SalesProductsView } from './SalesProductsView';
import './SalesPage.css';

type ViewMode = 'dispensas' | 'productos';

export function SalesPage() {
  const navigate = useNavigate();
  const { getCustomerName, loadCustomerNames } = useCustomerNames();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // Filtros
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dispensas');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar lista de clientes para el selector
  useEffect(() => {
    const loadCustomers = async () => {
      setCustomersLoading(true);
      try {
        const response = await customersService.search({ size: 100 });
        setCustomers(response.content);
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setCustomersLoading(false);
      }
    };
    loadCustomers();
  }, []);

  // Cargar ventas
  const loadSales = useCallback(async (page: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params: Parameters<typeof listSales>[0] = {
        page,
        size: 25,
      };

      if (selectedCustomerId) {
        params.customerId = selectedCustomerId;
      }

      if (dateRange) {
        // Convertir fechas a formato ISO_DATE_TIME (añadir hora 00:00:00)
        params.from = `${dateRange.from}T00:00:00`;
        params.to = `${dateRange.to}T23:59:59`;
      }

      const response: PageResponse<Sale> = await listSales(params);
      
      let filteredSales = response.content;
      
      if (viewMode === 'dispensas' && searchTerm) {
        const matchingCustomers = customers.filter(c => 
          c.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchingCustomerIds = matchingCustomers.map(c => c.id);
        filteredSales = response.content.filter(sale => 
          matchingCustomerIds.includes(sale.customerId)
        );
      }
      
      setSales(filteredSales);
      setPagination({
        page: response.number,
        size: response.size,
        total: filteredSales.length,
        totalPages: Math.ceil(filteredSales.length / response.size),
      });

      // Cargar nombres de clientes para las ventas mostradas
      const customerIds = response.content
        .map((sale) => sale.customerId)
        .filter((id, index, self) => self.indexOf(id) === index);
      await loadCustomerNames(customerIds);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las dispensaciones');
    } finally {
      setLoading(false);
    }
  }, [selectedCustomerId, dateRange, loadCustomerNames, viewMode, searchTerm, customers]);

  // Cargar ventas al montar y cuando cambien los filtros
  useEffect(() => {
    loadSales(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, dateRange, viewMode, searchTerm]);

  const handlePageChange = useCallback((page: number) => {
    loadSales(page);
  }, [loadSales]);

  const handleClearFilters = () => {
    setSelectedCustomerId('');
    setDateRange(null);
  };

  const customerOptions: SelectOption[] = [
    { value: '', label: 'Todos los socios' },
    ...customers.map((customer) => ({
      value: customer.id,
      label: customer.displayName,
    })),
  ];

  const columns: ColumnDef<Sale>[] = [
    {
      header: 'ID',
      accessor: (row) => (
        <button
          onClick={() => navigate(`/sales/${row.id}`)}
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
        >
          {row.id.substring(0, 8)}...
        </button>
      ),
    },
    {
      header: 'Socio',
      accessor: (row) => (
        <button
          onClick={() => navigate(`/customers/${row.customerId}`)}
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
          }}
        >
          {getCustomerName(row.customerId)}
        </button>
      ),
    },
    {
      header: 'Fecha/Hora',
      accessor: 'createdAt',
      cell: (value) => value ? formatDateTime(value) : '-',
    },
    {
      header: 'Total',
      accessor: 'totalAmount',
      cell: (value) => formatMoney(value),
    },
    {
      header: 'Items',
      accessor: (row) => row.items?.length || 0,
    },
    {
      header: 'Estado',
      accessor: 'status',
      cell: (value) => value === 'COMPLETED' ? 'Completada' : value,
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <PageHeader title="Dispensaciones" />
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Button
            variant={viewMode === 'dispensas' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('dispensas')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <HiViewGrid size={16} />
            Dispensas
          </Button>
          <Button
            variant={viewMode === 'productos' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('productos')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <HiCollection size={16} />
            Productos
          </Button>
        </div>
      </div>
       
      <div className="sales-page-container" style={{ marginTop: 'var(--spacing-lg)' }}>
        {/* Filtros mejorados */}
        <div className="sales-page-filters">
          <div className="sales-page-filters-header">
            <HiFilter className="sales-page-filters-icon" aria-hidden="true" />
            <h2 className="sales-page-filters-title">Filtros</h2>
          </div>
          
          <div className="sales-page-filters-content">
            <div className="sales-page-filter-group sales-page-filter-group-search">
              <Input
                type="text"
                placeholder={viewMode === 'dispensas' ? 'Buscar socio...' : 'Buscar producto o categoría...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {viewMode === 'dispensas' && (
              <div className="sales-page-filter-group sales-page-filter-group-customer">
                <Select
                  label="Socio"
                  options={customerOptions}
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  disabled={customersLoading}
                  data-tour="filter-customer"
                />
              </div>
            )}
            
            <div className="sales-page-filter-group sales-page-filter-group-date">
              <DateRangePicker
                value={dateRange || undefined}
                onChange={(range) => setDateRange(range || null)}
                dataTourFrom="filter-date-start"
                dataTourTo="filter-date-end"
              />
            </div>

            <div className="sales-page-filter-actions">
              {(selectedCustomerId || dateRange) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                  data-tour="clear-filters"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="sales-page-error">
            {error}
          </div>
        )}

        {viewMode === 'dispensas' ? (
          <div data-tour="sales-list">
            <CardList
              columns={columns}
              data={sales}
              loading={loading}
              pagination={pagination ? {
                page: pagination.page,
                size: pagination.size,
                total: pagination.total,
                totalPages: pagination.totalPages,
              } : undefined}
              onPageChange={handlePageChange}
              onRowClick={(sale) => navigate(`/sales/${sale.id}`)}
              emptyMessage="No hay dispensaciones disponibles"
              getRowDataTour={(sale) => `sale-row-${sale.id}`}
              renderCard={(sale, isExpanded, onToggleExpand) => (
                <SaleCard
                  sale={sale}
                  customerName={getCustomerName(sale.customerId)}
                  isExpanded={isExpanded}
                  onToggleExpand={onToggleExpand}
                  onClick={(sale) => navigate(`/sales/${sale.id}`)}
                />
              )}
            />
          </div>
        ) : (
          <SalesProductsView dateRange={dateRange} searchTerm={searchTerm} />
        )}
      </div>
    </>
  );
}
