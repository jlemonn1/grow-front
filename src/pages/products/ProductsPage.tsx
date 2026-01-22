import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Input';
import { CardList } from '@/components/common/CardList';
import { ProductCard } from '@/components/common/ProductCard';
import { type ColumnDef } from '@/components/common/DataTable';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Button } from '@/components/common/Button';
import { useProducts } from '@/hooks/useProducts';
import { useUI } from '@/context/ui.context';
import { useVisitor } from '@/context/visitor.context';
import { useAuth } from '@/context/auth.context';
import { AdminPermission } from '@/types/models';
import { deleteProduct, listProductsPublic } from '@/services/products.service';
import type { Product } from '@/types/models';
import type { PageResponse } from '@/types/api';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './ProductsPage.css';

export function ProductsPage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { isVisitorMode } = useVisitor();
  const { hasPermission } = useAuth();
  
  // Siempre llamar al hook (requisito de React)
  const productsContext = useProducts();
  
  // Usar valores del contexto solo si no estamos en modo visitante
  const contextProducts = isVisitorMode ? [] : productsContext.products;
  const contextLoading = isVisitorMode ? false : productsContext.loading;
  const contextError = isVisitorMode ? null : productsContext.error;
  const contextPagination = isVisitorMode ? { page: 0, size: 25, total: 0, totalPages: 0 } : productsContext.pagination;
  const loadProducts = isVisitorMode ? (() => Promise.resolve()) : productsContext.loadProducts;
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado para modo visitante
  const [visitorProducts, setVisitorProducts] = useState<Product[]>([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);
  const [visitorPagination, setVisitorPagination] = useState({
    page: 0,
    size: 25,
    total: 0,
    totalPages: 0,
  });

  // Usar datos según el modo
  const products = isVisitorMode ? visitorProducts : contextProducts;
  const loading = isVisitorMode ? visitorLoading : contextLoading;
  const error = isVisitorMode ? visitorError : contextError;
  const pagination = isVisitorMode ? visitorPagination : contextPagination;

  // Cargar productos (públicos o normales según el modo)
  const loadProductsData = useCallback(async (params?: { q?: string; page?: number; size?: number }) => {
    if (isVisitorMode) {
      setVisitorLoading(true);
      setVisitorError(null);
      try {
        const response: PageResponse<Product> = await listProductsPublic(params);
        setVisitorProducts(response.content);
        setVisitorPagination({
          page: response.number,
          size: response.size,
          total: response.totalElements,
          totalPages: response.totalPages,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar productos';
        setVisitorError(errorMessage);
        setVisitorProducts([]);
      } finally {
        setVisitorLoading(false);
      }
    } else {
      loadProducts(params);
    }
  }, [isVisitorMode, loadProducts]);

  // Cargar productos al montar
  useEffect(() => {
    loadProductsData({ page: 0, size: 25 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisitorMode]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProductsData({ q: searchQuery || undefined, page: 0, size: 25 });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handlePageChange = useCallback((page: number) => {
    loadProductsData({ q: searchQuery || undefined, page, size: 25 });
  }, [searchQuery, loadProductsData]);

  const handleRowClick = useCallback((product: Product) => {
    // En modo visitante, no permitir navegar a detalles
    if (isVisitorMode) {
      return;
    }
    navigate(`/products/${product.id}`);
  }, [navigate, isVisitorMode]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, product });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.product) return;

    setIsDeleting(true);
    try {
      await deleteProduct(deleteModal.product.id);
      showToast('Producto eliminado exitosamente', 'success');
      setDeleteModal({ isOpen: false, product: null });
      // Recargar productos
      loadProductsData({ q: searchQuery || undefined, page: 0, size: 25 });
    } catch (err) {
      showToast('Error al eliminar producto', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.product, showToast, loadProducts, searchQuery]);

  const handleCloseDeleteModal = useCallback(() => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, product: null });
    }
  }, [isDeleting]);

  const columns: ColumnDef<Product>[] = [
    {
      header: 'Nombre',
      accessor: 'name',
    },
    {
      header: 'Categoría',
      accessor: (row) => row.category?.name || '-',
    },
    {
      header: 'Precio por gramo',
      accessor: 'pricePerGram',
      cell: (value) => formatMoney(value),
    },
    {
      header: 'Stock',
      accessor: 'stockGrams',
      cell: (value) => `${value}g`,
    },
    {
      header: 'Fecha creación',
      accessor: 'createdAt',
      cell: (value) => value ? formatDateTime(value) : '-',
    },
    ...(isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_PRODUCTOS) ? [] : [{
      header: 'Acciones',
      accessor: 'id',
      cell: (_value, row) => (
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
        title="Productos"
        action={!isVisitorMode && hasPermission(AdminPermission.GESTIONAR_PRODUCTOS) ? {
          label: '+ Nuevo producto',
          onClick: () => navigate('/products/new'),
        } : undefined}
      />
      
      <div className="products-page-container" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="products-page-search">
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '400px', width: '100%' }}
          />
        </div>

        {error && (
          <div className="products-page-error">
            {error}
          </div>
        )}

        <CardList
          columns={columns}
          data={products}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRowClick={isVisitorMode ? undefined : handleRowClick}
          onDelete={isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_PRODUCTOS) ? undefined : ((product) => {
            setDeleteModal({ isOpen: true, product });
          })}
          emptyMessage="No hay productos disponibles"
          renderCard={(product, isExpanded, onToggleExpand) => (
            <ProductCard
              key={product.id}
              product={product}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onClick={isVisitorMode ? undefined : handleRowClick}
              onDelete={isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_PRODUCTOS) ? undefined : ((p) => {
                setDeleteModal({ isOpen: true, product: p });
              })}
            />
          )}
        />
      </div>

      {deleteModal.isOpen && deleteModal.product && (
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Eliminar producto"
          message="¿Estás seguro de que deseas eliminar el producto"
          itemName={deleteModal.product.name}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
