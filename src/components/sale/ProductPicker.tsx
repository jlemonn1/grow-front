import { memo, useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Input } from '@/components/forms/Input';
import { ProductImage } from '@/components/common/ProductImage';
import { ProductPickerGrid } from './ProductPickerGrid';
import { ProductPickerList } from './ProductPickerList';
import { listProducts } from '@/services/products.service';
import { listCategories } from '@/services/categories.service';
import { useProductPickerView } from '@/hooks/useProductPickerView';
import type { Product, Category } from '@/types/models';
import { getMeasurementShortLabel } from '@/utils/measurement';
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [showCategories, setShowCategories] = useState(false);
    const { viewMode, toggleViewMode, isListMode } = useProductPickerView();
    const initialListLoadRef = useRef(false);

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

  // Precargar productos iniciales cuando estamos en modo lista
  useEffect(() => {
    if (isListMode && !selectedProduct && !searchQuery.trim() && !selectedCategoryId) {
      if (initialListLoadRef.current) return;
      initialListLoadRef.current = true;
      const loadInitialProducts = async () => {
        setLoading(true);
        try {
          const response = await listProducts({ page: 0, size: 10 });
          const sortedResults = [...response.content].sort((a, b) => {
            if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
            if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
            return 0;
          });
          setResults(sortedResults);
          setShowResults(true);
          setShowCategories(false);
        } catch (error) {
          console.error('Error al cargar productos iniciales:', error);
        } finally {
          setLoading(false);
        }
      };
      loadInitialProducts();
    } else {
      initialListLoadRef.current = false;
    }
  }, [isListMode, selectedProduct, searchQuery, selectedCategoryId]);

  // Reaccionar a cambios de viewMode
  useEffect(() => {
    // Si cambiamos a modo carpetas y no hay búsqueda ni categoría, mostrar categorías
    if (!isListMode && !selectedProduct && !searchQuery.trim() && !selectedCategoryId && categories.length > 0) {
      setShowCategories(true);
      setShowResults(false);
    }
    // Si cambiamos a modo lista y no hay búsqueda ni categoría, ocultar categorías
    if (isListMode && showCategories && !searchQuery.trim() && !selectedCategoryId) {
      setShowCategories(false);
    }
  }, [isListMode, selectedProduct, searchQuery, selectedCategoryId, categories.length, showCategories]);

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
      // En modo lista sin categoría, no limpiar resultados ni forzar categorías
      if (isListMode && !selectedCategoryId) {
        setShowCategories(false);
        return;
      }
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
  }, [searchQuery, selectedProduct, selectedCategoryId, categories.length, isListMode]);

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
            if (selectedProduct) return;
            // Si no hay texto y no hay producto seleccionado
            if (!searchQuery.trim() && !selectedCategoryId) {
              if (isListMode) {
                // En modo lista, mostrar resultados ya cargados
                if (results.length > 0) {
                  setShowResults(true);
                  setShowCategories(false);
                }
              } else if (categories.length > 0) {
                setShowCategories(true);
              }
            }
            // Solo mostrar resultados si hay búsqueda activa
            else if (results.length > 0 && searchQuery.trim().length > 0) {
              setShowResults(true);
            }
            // Si hay categoría seleccionada pero no hay texto, mostrar productos de esa categoría
            else if (selectedCategoryId && !searchQuery.trim()) {
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

      <div className="product-picker-view-toggle">
        <button
          type="button"
          className={`product-picker-view-btn ${viewMode === 'folders' ? 'active' : ''}`}
          onClick={() => viewMode !== 'folders' && toggleViewMode()}
          aria-label="Vista carpetas"
          title="Vista carpetas"
        >
          <span className="product-picker-view-icon">📁</span>
          <span className="product-picker-view-label">Carpetas</span>
        </button>
        <button
          type="button"
          className={`product-picker-view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => viewMode !== 'list' && toggleViewMode()}
          aria-label="Vista lista"
          title="Vista lista"
        >
          <span className="product-picker-view-icon">☰</span>
          <span className="product-picker-view-label">Lista</span>
        </button>
      </div>

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
          ) : isListMode ? (
            <ProductPickerList
              products={results}
              selectedProduct={selectedProduct}
              onSelect={handleSelect}
            />
          ) : (
            <ProductPickerGrid
              products={results}
              selectedProduct={selectedProduct}
              onSelect={handleSelect}
            />
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
