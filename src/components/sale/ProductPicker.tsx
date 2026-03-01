import { memo, useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Input } from '@/components/forms/Input';
import { ProductImage } from '@/components/common/ProductImage';
import { listProducts } from '@/services/products.service';
import { listCategories } from '@/services/categories.service';
import { customersService } from '@/services/customers.service';
import type { Product, Category } from '@/types/models';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';
import './ProductPicker.css';

interface ProductPickerProps {
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
  customerId?: string | null;
}

export interface ProductPickerRef {
  focus: () => void;
}

const ProductPickerComponent = forwardRef<ProductPickerRef, ProductPickerProps>(
  ({ selectedProduct, onSelect, customerId }, ref) => {
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [showCategories, setShowCategories] = useState(false);
    const [quickOptions, setQuickOptions] = useState<Product[]>([]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const cats = await listCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Cargar quick options del socio cuando hay customerId
  useEffect(() => {
    if (!customerId) {
      setQuickOptions([]);
      return;
    }

    const loadQuickOptions = async () => {
      try {
        const recommended = await customersService.getRecommendedProducts(customerId);
        setQuickOptions(recommended.slice(0, 6));
      } catch (error) {
        console.error('Error al cargar quick options:', error);
        setQuickOptions([]);
      }
    };

    loadQuickOptions();
  }, [customerId]);

  // Limpiar estados internos cuando selectedProduct cambia a null
  useEffect(() => {
    if (!selectedProduct) {
      setSearchQuery('');
      setResults([]);
      setShowResults(false);
      setSelectedCategoryId(null);
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
      setShowCategories(false);
      return;
    }
    
    // Si hay una categoría seleccionada, buscar productos de esa categoría
    if (selectedCategoryId && !trimmed) {
      const timer = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await listProducts({ 
            categoryId: selectedCategoryId, 
            page: 0, 
            size: 100 
          });
          const sortedResults = [...response.content].sort((a, b) => {
            if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
            if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
            return 0;
          });
          setResults(sortedResults);
          setShowResults(true);
          setShowCategories(false);
        } catch (error) {
          console.error('Error al buscar productos por categoría:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    
    if (!trimmed) {
      setResults([]);
      setShowResults(false);
      // Si no hay texto y hay categorías, mostrar categorías
      if (categories.length > 0 && !selectedCategoryId) {
        setShowCategories(true);
      } else {
        setShowCategories(false);
      }
      return;
    }

    // Si hay texto, buscar productos normalmente
    setShowCategories(false);
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params: { q: string; categoryId?: string; page: number; size: number } = {
          q: trimmed,
          page: 0,
          size: 10
        };
        // Si hay una categoría seleccionada, también filtrar por categoría
        if (selectedCategoryId) {
          params.categoryId = selectedCategoryId;
        }
        const response = await listProducts(params);
        const sortedResults = [...response.content].sort((a, b) => {
          if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
          if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
          return 0;
        });
        setResults(sortedResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error al buscar productos:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedProduct, selectedCategoryId, categories.length]);

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
    setSelectedCategoryId(null);
    setShowCategories(false);
  }, [onSelect]);

  const handleCategorySelect = useCallback((category: Category) => {
    setSelectedCategoryId(category.id);
    setSearchQuery('');
    setShowCategories(false);
    // La búsqueda se activará automáticamente por el useEffect
  }, []);

  const handleClearCategory = useCallback(() => {
    setSelectedCategoryId(null);
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
    if (categories.length > 0) {
      setShowCategories(true);
    }
  }, [categories.length]);

  return (
    <div className="product-picker" role="combobox" aria-expanded={showResults} aria-haspopup="listbox">
      <div className="product-picker-input-wrapper">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar producto..."
          value={searchQuery}
          data-tour="product-search-input"
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Si hay un producto seleccionado y el usuario empieza a escribir, limpiar selección
            if (selectedProduct && e.target.value !== selectedProduct.name) {
              onSelect(null);
            }
            // Si el usuario empieza a escribir, ocultar categorías
            if (e.target.value.trim().length > 0) {
              setShowCategories(false);
            }
          }}
          onFocus={() => {
            // Si no hay texto y no hay producto seleccionado, mostrar categorías
            if (!selectedProduct && !searchQuery.trim() && categories.length > 0 && !selectedCategoryId) {
              setShowCategories(true);
            }
            // Solo mostrar resultados si hay búsqueda activa y no hay producto seleccionado
            else if (!selectedProduct && results.length > 0 && searchQuery.trim().length > 0) {
              setShowResults(true);
            }
            // Si hay categoría seleccionada pero no hay texto, mostrar productos de esa categoría
            else if (!selectedProduct && selectedCategoryId && !searchQuery.trim()) {
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
                setShowCategories(false);
              } else {
                // Si no hay producto seleccionado, ocultar categorías y resultados
                setShowCategories(false);
                if (!selectedCategoryId) {
                  setShowResults(false);
                }
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

      {customerId && quickOptions.length > 0 && !searchQuery.trim() && !selectedProduct && (
        <div className="product-picker-quick-options">
          <div className="product-picker-quick-options-scroll">
            {quickOptions.map((product) => (
              <button
                key={product.id}
                type="button"
                className="product-picker-quick-option-chip"
                onClick={() => handleSelect(product)}
                aria-label={`Agregar ${product.name}`}
              >
                <ProductImage
                  imageUrl={product.imageUrl}
                  alt={product.name}
                  size="small"
                  className="product-picker-quick-option-image"
                />
                <span className="product-picker-quick-option-name">{product.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showCategories && (
        <div className="product-picker-results" role="listbox" id="product-picker-categories">
          {loadingCategories ? (
            <div className="product-picker-loading" role="status" aria-live="polite">
              Cargando categorías...
            </div>
          ) : categories.length === 0 ? (
            <div className="product-picker-empty" role="status" aria-live="polite">
              No hay categorías disponibles
            </div>
          ) : (
            <ul className="product-picker-list">
              {categories.map((category) => (
                <li
                  key={category.id}
                  id={`category-${category.id}`}
                  className={`product-picker-item product-picker-category-item ${
                    selectedCategoryId === category.id ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => handleCategorySelect(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCategorySelect(category);
                    }
                  }}
                  role="option"
                  aria-selected={selectedCategoryId === category.id}
                  tabIndex={0}
                >
                  <div className="product-picker-category-icon">📁</div>
                  <div className="product-picker-item-info">
                    <div className="product-picker-item-name">{category.name}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showResults && (
        <div className="product-picker-results" role="listbox" id="product-picker-list">
          {selectedCategoryId && (
            <div className="product-picker-category-filter">
              <span className="product-picker-category-filter-label">
                Categoría: <strong>{categories.find(c => c.id === selectedCategoryId)?.name}</strong>
              </span>
              <button
                type="button"
                className="product-picker-category-filter-clear"
                onClick={handleClearCategory}
                aria-label="Limpiar filtro de categoría"
              >
                ×
              </button>
            </div>
          )}
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
                {results.map((product) => {
                  const measurementSuffix = getMeasurementShortLabel(product.measurementType);
                  return (
                  <li
                  key={product.id}
                  id={`product-${product.id}`}
                  className={`product-picker-item ${
                    selectedProduct?.id === product.id ? 'selected' : ''
                  } ${product.stockGrams <= 0 ? 'out-of-stock' : ''}`}
                  data-tour={`product-row-${product.id}`}
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
                      <span>{formatMoney(product.pricePerGram)}/{measurementSuffix}</span>
                      <span className={`product-picker-stock ${product.stockGrams <= 0 ? 'stock-zero' : ''}`}>
                        Stock: {product.stockGrams}{measurementSuffix}
                      </span>
                    </div>
                  </div>
                  </li>
                );
                })}
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
              Stock: {selectedProduct.stockGrams}{getMeasurementShortLabel(selectedProduct.measurementType)}
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
