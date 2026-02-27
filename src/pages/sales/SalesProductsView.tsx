import { useEffect, useState, useCallback } from 'react';
import { getProductsSummary, type ProductSalesSummary } from '@/services/sales.service';
import type { DateRange } from '@/components/common/DateRangePicker';
import { formatMoney } from '@/utils/money';
import './SalesProductsView.css';

interface SalesProductsViewProps {
  dateRange: DateRange | null;
  searchTerm: string;
}

export function SalesProductsView({ dateRange, searchTerm }: SalesProductsViewProps) {
  const [products, setProducts] = useState<ProductSalesSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let from: string | undefined;
      let to: string | undefined;

      if (dateRange) {
        from = `${dateRange.from}T00:00:00`;
        to = `${dateRange.to}T23:59:59`;
      }

      const response = await getProductsSummary(from, to);
      setProducts(response);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = searchTerm
    ? products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : products;

  const totalGrams = filteredProducts.reduce((sum, p) => sum + p.totalGrams, 0);
  const totalAmount = filteredProducts.reduce((sum, p) => sum + p.totalRecaudado, 0);

  return (
    <div className="sales-products-view">
      {error && (
        <div className="sales-products-view-error">
          {error}
        </div>
      )}

      <div className="sales-products-view-summary">
        <div className="sales-products-view-summary-item">
          <span className="sales-products-view-summary-label">Productos únicos</span>
          <span className="sales-products-view-summary-value">{filteredProducts.length}</span>
        </div>
        <div className="sales-products-view-summary-item">
          <span className="sales-products-view-summary-label">Gramos totales</span>
          <span className="sales-products-view-summary-value">{totalGrams.toFixed(2)}g</span>
        </div>
        <div className="sales-products-view-summary-item">
          <span className="sales-products-view-summary-label">Total recaudado</span>
          <span className="sales-products-view-summary-value">{formatMoney(totalAmount)}</span>
        </div>
      </div>

      <div className="sales-products-view-table-container">
        {loading ? (
          <div className="sales-products-view-loading">Cargando...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="sales-products-view-empty">
            No hay productos vendidos en el período seleccionado
          </div>
        ) : (
          <table className="sales-products-view-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Total gramos</th>
                <th>Total recaudado</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.productId}>
                  <td className="sales-products-view-product">
                    <span className="sales-products-view-product-name">
                      {product.productName}
                    </span>
                  </td>
                  <td>{product.totalGrams.toFixed(2)}g</td>
                  <td>{formatMoney(product.totalRecaudado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
