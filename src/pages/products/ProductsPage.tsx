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
import { deleteProduct } from '@/services/products.service';
import type { Product } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './ProductsPage.css';

export function ProductsPage() {
  const navigate = useNavigate();
  const { products, loading, error, pagination, loadProducts } = useProducts();
  const { showToast } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar productos al montar
  useEffect(() => {
    loadProducts({ page: 0, size: 25 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts({ q: searchQuery || undefined, page: 0, size: 25 });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handlePageChange = useCallback((page: number) => {
    loadProducts({ q: searchQuery || undefined, page, size: 25 });
  }, [searchQuery, loadProducts]);

  const handleRowClick = useCallback((product: Product) => {
    navigate(`/products/${product.id}`);
  }, [navigate]);

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
      loadProducts({ q: searchQuery || undefined, page: 0, size: 25 });
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
        title="Productos"
        action={{
          label: '+ Nuevo producto',
          onClick: () => navigate('/products/new'),
        }}
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
          onRowClick={handleRowClick}
          onDelete={(product) => {
            setDeleteModal({ isOpen: true, product });
          }}
          emptyMessage="No hay productos disponibles"
          renderCard={(product, isExpanded, onToggleExpand) => (
            <ProductCard
              key={product.id}
              product={product}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onClick={handleRowClick}
              onDelete={(p) => {
                setDeleteModal({ isOpen: true, product: p });
              }}
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
