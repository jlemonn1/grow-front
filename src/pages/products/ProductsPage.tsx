import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import type { PageHeaderAction } from '@/components/common/PageHeader';
import { Input } from '@/components/forms/Input';
import { CardList } from '@/components/common/CardList';
import { ProductCard } from '@/components/common/ProductCard';
import { type ColumnDef } from '@/components/common/DataTable';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Button } from '@/components/common/Button';
import { BatchStockInput } from '@/components/products/BatchStockInput';
import { useProducts } from '@/hooks/useProducts';
import { useUI } from '@/context/ui.context';
import { useVisitor } from '@/context/visitor.context';
import { useAuth } from '@/context/auth.context';
import { AdminPermission } from '@/types/models';
import { batchRechargeStock, deleteProduct, listProductsPublic } from '@/services/products.service';
import type { Product, BatchRechargeStockItem } from '@/types/models';
import type { PageResponse } from '@/types/api';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';
import { formatDateTime } from '@/utils/dates';
import './ProductsPage.css';

export function ProductsPage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { isVisitorMode } = useVisitor();
  const { hasPermission } = useAuth();
  const canManageStock = !isVisitorMode && hasPermission(AdminPermission.GESTIONAR_STOCK);
  
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
  const [batchMode, setBatchMode] = useState(false);
  const [batchInputs, setBatchInputs] = useState<Record<string, string>>({});
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  
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
        const sortedProducts = [...response.content].sort((a, b) => {
          if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
          if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
          return 0;
        });
        setVisitorProducts(sortedProducts);
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

  const batchPayload = useMemo<BatchRechargeStockItem[]>(() => {
    const payload: BatchRechargeStockItem[] = [];
    for (const [productId, rawValue] of Object.entries(batchInputs)) {
      const grams = Number(rawValue);
      if (!Number.isFinite(grams) || grams <= 0) {
        continue;
      }
      payload.push({ productId, grams });
    }
    return payload;
  }, [batchInputs]);

  const handleBatchInputChange = useCallback((productId: string, rawValue: string) => {
    const normalized = rawValue.replace(',', '.');
    setBatchInputs((prev) => {
      if (normalized.trim() === '') {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: normalized };
    });
  }, []);

  const handleCancelBatch = useCallback(() => {
    setBatchMode(false);
    setBatchInputs({});
  }, []);

  const handleEnableBatchMode = useCallback(() => {
    setBatchMode(true);
    setBatchInputs({});
  }, []);

  const handleBatchSubmit = useCallback(async () => {
    if (batchPayload.length === 0) {
      showToast('Añade cantidades válidas antes de confirmar la recarga', 'warning');
      return;
    }

    setIsBatchSubmitting(true);
    try {
      await batchRechargeStock({ items: batchPayload });
      showToast('Stock actualizado correctamente', 'success');
      setBatchMode(false);
      setBatchInputs({});
      await loadProductsData({
        q: searchQuery || undefined,
        page: pagination.page,
        size: pagination.size,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al recargar stock';
      showToast(message, 'error');
    } finally {
      setIsBatchSubmitting(false);
    }
  }, [batchPayload, showToast, loadProductsData, pagination.page, pagination.size, searchQuery]);

  const batchEnableAction: PageHeaderAction = {
    label: 'Recarga masiva',
    variant: 'secondary',
    onClick: handleEnableBatchMode,
    dataTour: 'bulk-stock',
  };

  const batchConfirmAction: PageHeaderAction = {
    label: 'Confirmar recargas',
    onClick: handleBatchSubmit,
    loading: isBatchSubmitting,
    disabled: batchPayload.length === 0 || isBatchSubmitting,
  };

  const batchCancelAction: PageHeaderAction = {
    label: 'Cancelar',
    variant: 'secondary',
    onClick: handleCancelBatch,
    disabled: isBatchSubmitting,
  };

  const extraActions = canManageStock
    ? batchMode
      ? [batchConfirmAction, batchCancelAction]
      : [batchEnableAction]
    : undefined;

  const baseColumns = useMemo<ColumnDef<Product>[]>(() => [
    {
      header: 'Nombre',
      accessor: 'name',
    },
    {
      header: 'Categoría',
      accessor: (row) => row.category?.name || '-',
    },
    {
      header: 'Precio unitario',
      accessor: 'pricePerGram',
      cell: (_value, row) => `${formatMoney(row.pricePerGram)}/${getMeasurementShortLabel(row.measurementType)}`,
    },
    {
      header: 'Stock',
      accessor: 'stockGrams',
      cell: (value, row) => `${value}${getMeasurementShortLabel(row.measurementType)}`,
    },
    {
      header: 'Fecha creación',
      accessor: 'createdAt',
      cell: (value) => value ? formatDateTime(value) : '-',
    },
  ], []);

  const actionColumn = useMemo<ColumnDef<Product> | null>(() => {
    if (isVisitorMode || !hasPermission(AdminPermission.GESTIONAR_PRODUCTOS)) {
      return null;
    }
    return {
      header: 'Acciones',
      accessor: (row: Product) => (
        <Button
          variant="danger"
          onClick={(e) => handleDeleteClick(e, row)}
          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}
        >
          Eliminar
        </Button>
      ),
    };
  }, [handleDeleteClick, hasPermission, isVisitorMode]);

  const batchColumn = useMemo<ColumnDef<Product>>(() => ({
    header: 'Recarga',
    accessor: (product) => (
      <BatchStockInput
        productName={product.name}
        value={batchInputs[product.id] ?? ''}
        onChange={(value) => handleBatchInputChange(product.id, value)}
        disabled={isBatchSubmitting}
      />
    ),
  }), [batchInputs, handleBatchInputChange, isBatchSubmitting]);

  const columns = useMemo<ColumnDef<Product>[]>(() => {
    const result = [...baseColumns];
    if (batchMode && canManageStock) {
      result.push(batchColumn);
    }
    if (actionColumn) {
      result.push(actionColumn);
    }
    return result;
  }, [actionColumn, batchColumn, batchMode, baseColumns, canManageStock]);

  return (
    <>
      <PageHeader
        title="Productos"
        action={!isVisitorMode && hasPermission(AdminPermission.GESTIONAR_PRODUCTOS) ? {
          label: '+ Nuevo producto',
          onClick: () => navigate('/products/new'),
          dataTour: 'create-product',
        } : undefined}
        extraActions={extraActions}
      />
      
      <div className="products-page-container" style={{ marginTop: 'var(--spacing-lg)' }} data-tour="products-list">
        <div className="products-page-search">
          <Input
            type="text"
            placeholder="Buscar productos o categorías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '400px', width: '100%' }}
            data-tour="product-search"
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
          getRowDataTour={(product) => `product-row-${product.id}`}
          renderCard={(product, isExpanded, onToggleExpand) => (
            <div data-tour={`product-row-${product.id}`}>
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
              {batchMode && canManageStock && (
                <div className="products-page-batch-card-input">
                  <BatchStockInput
                    productName={product.name}
                    value={batchInputs[product.id] ?? ''}
                    onChange={(value) => handleBatchInputChange(product.id, value)}
                    disabled={isBatchSubmitting}
                  />
                </div>
              )}
            </div>
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
