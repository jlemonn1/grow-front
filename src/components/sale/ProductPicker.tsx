import { memo, useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Input } from '@/components/forms/Input';
import { ProductImage } from '@/components/common/ProductImage';
import { listProducts } from '@/services/products.service';
import type { Product } from '@/types/models';
import { formatMoney } from '@/utils/money';
import './ProductPicker.css';

interface ProductPickerProps {
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
}

export interface ProductPickerRef {
  focus: () => void;
}

const ProductPickerComponent = forwardRef<ProductPickerRef, ProductPickerProps>(
  ({ selectedProduct, onSelect }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Limpiar estados internos cuando selectedProduct cambia a null
  useEffect(() => {
    if (!selectedProduct) {
      setSearchQuery('');
      setResults([]);
      setShowResults(false);
      // Limpiar el input si existe
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [selectedProduct]);

  // Búsqueda con debounce - solo buscar si no hay producto seleccionado
  useEffect(() => {
    const trimmed = searchQuery.trim();
    
    // Si hay un producto seleccionado y el query coincide con su nombre, no buscar
    if (selectedProduct && trimmed === selectedProduct.name) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    if (!trimmed) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await listProducts({ 
          q: trimmed, 
          page: 0, 
          size: 10 
        });
        setResults(response.content);
        setShowResults(true);
      } catch (error) {
        console.error('Error al buscar productos:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedProduct]);

  const handleSelect = useCallback((product: Product) => {
    onSelect(product);
    setSearchQuery(product.name);
    setShowResults(false);
    setResults([]);
    // Quitar foco del input para evitar que se vuelva a abrir
    inputRef.current?.blur();
  }, [onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null);
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
  }, [onSelect]);

  return (
    <div className="product-picker" role="combobox" aria-expanded={showResults} aria-haspopup="listbox">
      <div className="product-picker-input-wrapper">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar producto..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Si hay un producto seleccionado y el usuario empieza a escribir, limpiar selección
            if (selectedProduct && e.target.value !== selectedProduct.name) {
              onSelect(null);
            }
          }}
          onFocus={() => {
            // Solo mostrar resultados si hay búsqueda activa y no hay producto seleccionado
            if (!selectedProduct && results.length > 0 && searchQuery.trim().length > 0) {
              setShowResults(true);
            }
          }}
          onBlur={() => {
            // Pequeño delay para permitir que el click en el item se procese primero
            setTimeout(() => {
              // Si hay un producto seleccionado, mantener su nombre en el input
              if (selectedProduct) {
                setSearchQuery(selectedProduct.name);
                setShowResults(false);
              }
            }, 200);
          }}
          aria-label="Buscar producto"
          aria-autocomplete="list"
          aria-controls="product-picker-list"
          aria-activedescendant={selectedProduct ? `product-${selectedProduct.id}` : undefined}
        />
        {selectedProduct && (
          <button 
            type="button"
            className="product-picker-clear"
            onClick={handleClear}
            aria-label="Limpiar selección"
          >
            ×
          </button>
        )}
      </div>

      {showResults && (
        <div className="product-picker-results" role="listbox" id="product-picker-list">
          {loading ? (
            <div className="product-picker-loading" role="status" aria-live="polite">
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="product-picker-empty" role="status" aria-live="polite">
              No se encontraron productos
            </div>
          ) : (
            <ul className="product-picker-list">
              {results.map((product) => (
                <li
                  key={product.id}
                  id={`product-${product.id}`}
                  className={`product-picker-item ${
                    selectedProduct?.id === product.id ? 'selected' : ''
                  } ${product.stockGrams <= 0 ? 'out-of-stock' : ''}`}
                  onMouseDown={(e) => {
                    // Prevenir que el blur del input cierre el dropdown antes del click
                    e.preventDefault();
                  }}
                  onClick={() => handleSelect(product)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(product);
                    }
                  }}
                  role="option"
                  aria-selected={selectedProduct?.id === product.id}
                  aria-disabled={product.stockGrams <= 0}
                  tabIndex={0}
                >
                  <ProductImage 
                    imageUrl={product.imageUrl} 
                    alt={product.name}
                    size="small"
                    className="product-picker-item-image"
                  />
                  <div className="product-picker-item-info">
                    <div className="product-picker-item-name">{product.name}</div>
                    <div className="product-picker-item-details">
                      <span>{formatMoney(product.pricePerGram)}/g</span>
                      <span className={`product-picker-stock ${product.stockGrams <= 0 ? 'stock-zero' : ''}`}>
                        Stock: {product.stockGrams}g
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedProduct && !showResults && (
        <div className="product-picker-selected">
          <ProductImage 
            imageUrl={selectedProduct.imageUrl} 
            alt={selectedProduct.name}
            size="small"
            className="product-picker-selected-image"
          />
          <div>
            Producto seleccionado: <strong>{selectedProduct.name}</strong>
            <span className="product-picker-selected-stock">
              (Stock: {selectedProduct.stockGrams}g)
            </span>
          </div>
        </div>
      )}
    </div>
  );
  }
);

ProductPickerComponent.displayName = 'ProductPickerComponent';

export const ProductPicker = memo(ProductPickerComponent);
