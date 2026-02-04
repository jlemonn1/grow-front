import { useState, useEffect } from 'react';
import { customersService } from '@/services/customers.service';
import { ProductImage } from '@/components/common/ProductImage';
import type { Product } from '@/types/models';
import './RecommendedProductsGallery.css';

interface RecommendedProductsGalleryProps {
  customerId: string | null;
  onProductSelect: (product: Product) => void;
  loading?: boolean;
}

const INITIAL_VISIBLE_COUNT = 4;

export function RecommendedProductsGallery({
  customerId,
  onProductSelect,
  loading: externalLoading = false,
}: RecommendedProductsGalleryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Cargar productos recomendados cuando cambia el cliente
  useEffect(() => {
    if (!customerId) {
      setProducts([]);
      setIsExpanded(false);
      return;
    }

    const loadRecommendedProducts = async () => {
      setLoading(true);
      try {
        const recommendedProducts = await customersService.getRecommendedProducts(customerId);
        setProducts(recommendedProducts);
        setIsExpanded(false); // Resetear expansión al cambiar cliente
      } catch (error) {
        console.error('Error al cargar productos recomendados:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendedProducts();
  }, [customerId]);

  // Si no hay cliente o no hay productos, no mostrar nada
  if (!customerId || (products.length === 0 && !loading && !externalLoading)) {
    return null;
  }

  const isLoading = loading || externalLoading;
  const visibleProducts = isExpanded ? products : products.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = products.length > INITIAL_VISIBLE_COUNT;

  const handleProductClick = (product: Product) => {
    onProductSelect(product);
  };

  return (
    <div className="recommended-products-gallery">
      <div className="recommended-products-gallery-header">
        <h3 className="recommended-products-gallery-title">Productos Recomendados</h3>
        {hasMore && (
          <button
            type="button"
            className="recommended-products-gallery-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Ver menos' : 'Ver más'}
          >
            {isExpanded ? 'Ver menos' : `Ver más (${products.length - INITIAL_VISIBLE_COUNT})`}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="recommended-products-gallery-loading">
          Cargando recomendados...
        </div>
      ) : (
        <div className="recommended-products-gallery-container">
          <div className="recommended-products-gallery-scroll">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="recommended-products-gallery-chip"
                onClick={() => handleProductClick(product)}
                aria-label={`Seleccionar ${product.name}`}
              >
                <div className="recommended-products-gallery-chip-image">
                  <ProductImage
                    imageUrl={product.imageUrl}
                    alt={product.name}
                  />
                </div>
                <span className="recommended-products-gallery-chip-name">{product.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
