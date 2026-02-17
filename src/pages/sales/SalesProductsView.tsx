import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSales } from '@/services/sales.service';
import type { Sale, SaleItem } from '@/types/models';
import type { DateRange } from '@/components/common/DateRangePicker';
import type { PageResponse } from '@/types/api';
import { formatMoney } from '@/utils/money';
import { formatDateTime } from '@/utils/dates';
import './SalesProductsView.css';

interface SalesProductsViewProps {
  dateRange: DateRange | null;
  searchTerm: string;
}

interface ProductSaleItem extends SaleItem {
  saleId: string;
  saleCreatedAt: string;
}

export function SalesProductsView({ dateRange, searchTerm }: SalesProductsViewProps) {
  const navigate = useNavigate();
  
  const [items, setItems] = useState<ProductSaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    size: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const loadProducts = useCallback(async (page: number = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params: Parameters<typeof listSales>[0] = {
        page,
        size: 50,
      };

      if (dateRange) {
        params.from = `${dateRange.from}T00:00:00`;
        params.to = `${dateRange.to}T23:59:59`;
      }

      const response: PageResponse<Sale> = await listSales(params);
      
      const allItems: ProductSaleItem[] = [];
      
      response.content.forEach((sale) => {
        sale.items.forEach((item) => {
          allItems.push({
            ...item,
            saleId: sale.id,
            saleCreatedAt: sale.createdAt,
          });
        });
      });

      allItems.sort((a, b) => 
        new Date(b.saleCreatedAt).getTime() - new Date(a.saleCreatedAt).getTime()
      );

      const filteredItems = searchTerm
        ? allItems.filter(item => 
            item.productName.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allItems;

      setItems(filteredItems);
      setPagination({
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [dateRange, searchTerm]);

  useEffect(() => {
    loadProducts(0);
  }, [loadProducts]);

  const handlePageChange = (page: number) => {
    loadProducts(page);
  };

  const totalGrams = items.reduce((sum, item) => sum + item.grams, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <div className="sales-products-view">
      {error && (
        <div className="sales-products-view-error">
          {error}
        </div>
      )}

      <div className="sales-products-view-summary">
        <div className="sales-products-view-summary-item">
          <span className="sales-products-view-summary-label">Productos vendidos</span>
          <span className="sales-products-view-summary-value">{items.length}</span>
        </div>
        <div className="sales-products-view-summary-item">
          <span className="sales-products-view-summary-label">Gramos totales</span>
          <span className="sales-products-view-summary-value">{totalGrams.toFixed(2)}g</span>
        </div>
        <div className="sales-products-view-summary-item">
          <span className="sales-products-view-summary-label">Ventas totales</span>
          <span className="sales-products-view-summary-value">{formatMoney(totalAmount)}</span>
        </div>
      </div>

      <div className="sales-products-view-table-container">
        {loading ? (
          <div className="sales-products-view-loading">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="sales-products-view-empty">
            No hay productos vendidos en el período seleccionado
          </div>
        ) : (
          <>
            <table className="sales-products-view-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Gramos</th>
                  <th>Precio/g</th>
                  <th>Total</th>
                  <th>Venta</th>
                  <th>Fecha/Hora</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.saleId}-${item.productId}-${index}`}>
                    <td className="sales-products-view-product">
                      {item.imageUrl && (
                        <img 
                          src={item.imageUrl} 
                          alt={item.productName}
                          className="sales-products-view-product-image"
                        />
                      )}
                      <span className="sales-products-view-product-name">
                        {item.productName}
                      </span>
                    </td>
                    <td>{item.grams.toFixed(2)}g</td>
                    <td>{formatMoney(item.pricePerGram)}/g</td>
                    <td>{formatMoney(item.lineTotal)}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/sales/${item.saleId}`)}
                        className="sales-products-view-sale-link"
                      >
                        {item.saleId.substring(0, 8)}...
                      </button>
                    </td>
                    <td>{formatDateTime(item.saleCreatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="sales-products-view-pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="sales-products-view-pagination-btn"
                >
                  Anterior
                </button>
                <span className="sales-products-view-pagination-info">
                  Página {pagination.page + 1} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  className="sales-products-view-pagination-btn"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
