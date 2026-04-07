import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiQrCode } from 'react-icons/hi2';
import { HiSearch, HiPhone, HiKey, HiUser, HiIdentification } from 'react-icons/hi';
import { Input } from '@/components/forms/Input';
import { GlobalSearchResultItem } from './GlobalSearchResultItem';
import { QRScannerModal } from '@/components/common/QRScannerModal';
import { Spinner } from '@/components/common/Spinner';
import { listProducts } from '@/services/products.service';
import { customersService } from '@/services/customers.service';
import { useTicket } from '@/hooks/useTicket';
import type { Product, Customer } from '@/types/models';
import './GlobalSearchModal.css';

type SearchType = 'name' | 'phone' | 'pin' | 'dni' | 'any';
type SearchMode = 'auto' | 'manual';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const { addProductToTicket, setCustomer } = useTicket();

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Estado para modo manual de búsqueda
  const [searchMode, setSearchMode] = useState<SearchMode>('auto');
  const [manualSearchType, setManualSearchType] = useState<SearchType | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Limpiar búsqueda al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setProducts([]);
      setCustomers([]);
      setSearchType(null);
      setSearchMode('auto');
      setManualSearchType(null);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Detectar tipo de búsqueda automática
  const getAutoSearchType = useCallback((query: string): SearchType => {
    if (query.length < 3) return 'any';
    
    const trimmed = query.trim();
    const isAllNumbers = /^\d+$/.test(trimmed);
    const isAllLetters = /^[a-zA-Z]+$/.test(trimmed);
    const hasNumbersAndLetters = /[0-9]/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
    
    if (isAllNumbers) {
      return 'phone';
    } else if (isAllLetters) {
      return 'name';
} else if (hasNumbersAndLetters && trimmed.length <= 8) {
      return 'pin';
    }
    
    return 'any';
  }, []);

  const handleChipClick = useCallback((type: SearchType) => {
    if (searchMode === 'manual' && manualSearchType === type) {
      setSearchMode('auto');
      setManualSearchType(null);
    } else {
      setSearchMode('manual');
      setManualSearchType(type);
    }
  }, [searchMode, manualSearchType]);

  const handleClearFilter = useCallback(() => {
    setSearchMode('auto');
    setManualSearchType(null);
  }, []);

  // Easter egg: detectar búsqueda de "onboarding"
  useEffect(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    
    // Si se busca "onboarding", navegar directamente al tour
    if (trimmed === 'onboarding') {
      onClose();
      navigate('/onboarding/tour?force=true');
      return;
    }
  }, [searchQuery, navigate, onClose]);

  // Búsqueda con debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    
    if (!trimmed) {
      setProducts([]);
      setCustomers([]);
      setSearchType(null);
      setLoading(false);
      return;
    }

    // Solo buscar si hay 3+ caracteres
    if (trimmed.length < 3) {
      setProducts([]);
      setCustomers([]);
      setSearchType(null);
      setLoading(false);
      return;
    }

    // Determinar el tipo de búsqueda según el modo
    let finalSearchType: SearchType;
    if (searchMode === 'manual' && manualSearchType) {
      finalSearchType = manualSearchType;
    } else {
      finalSearchType = getAutoSearchType(trimmed);
    }
    setSearchType(finalSearchType);

    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Buscar en paralelo productos y clientes
        const [productsResponse, customersResponse] = await Promise.all([
          listProducts({ q: trimmed, page: 0, size: 10 }),
          customersService.search({ q: trimmed, type: finalSearchType === 'any' ? undefined : finalSearchType, page: 0, size: 10 }),
        ]);

        const sortedProducts = [...productsResponse.content].sort((a, b) => {
          if (a.stockGrams <= 0 && b.stockGrams > 0) return 1;
          if (a.stockGrams > 0 && b.stockGrams <= 0) return -1;
          return 0;
        });

        setProducts(sortedProducts);
        setCustomers(customersResponse.content);
      } catch (error) {
        console.error('Error al buscar:', error);
        setProducts([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, getAutoSearchType, searchMode, manualSearchType]);

  // Manejar tecla ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleViewProductDetails = useCallback((productId: string) => {
    onClose();
    navigate(`/products/${productId}`);
  }, [navigate, onClose]);

  const handleViewCustomerDetails = useCallback((customerId: string) => {
    onClose();
    navigate(`/customers/${customerId}`);
  }, [navigate, onClose]);

  const handleDispenseProduct = useCallback(async (product: Product) => {
    try {
      // Pre-cargar producto en ticket (1g por defecto)
      await addProductToTicket(product, 1);
      
      // Cerrar modal y navegar
      onClose();
      navigate('/sales/new');
    } catch (error) {
      console.error('Error al pre-cargar producto:', error);
    }
  }, [addProductToTicket, navigate, onClose]);

  const handleDispenseCustomer = useCallback(async (customer: Customer) => {
    try {
      // Pre-cargar cliente en ticket
      setCustomer(customer);
      
      // Cerrar modal y navegar
      onClose();
      navigate('/sales/new');
    } catch (error) {
      console.error('Error al pre-cargar cliente:', error);
    }
  }, [setCustomer, navigate, onClose]);

  const handleQRScan = useCallback(async (customer: Customer) => {
    try {
      // Pre-cargar cliente en ticket
      setCustomer(customer);
      
      // Cerrar modales y navegar
      setShowQRScanner(false);
      onClose();
      navigate('/sales/new');
    } catch (error) {
      console.error('Error al pre-cargar cliente desde QR:', error);
    }
  }, [setCustomer, navigate, onClose]);

  if (!isOpen) return null;

  const hasResults = products.length > 0 || customers.length > 0;
  const showEmptyState = !loading && searchQuery.trim().length >= 3 && !hasResults;

  return (
    <div className="global-search-modal-overlay" onClick={onClose}>
      <div className="global-search-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-modal-header">
          <h2 className="global-search-modal-title">Búsqueda Global</h2>
          <button
            className="global-search-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="global-search-modal-body">
          {/* Chips de selección de tipo de búsqueda */}
          <div className="global-search-modal-chips">
            <button
              type="button"
              className={`global-search-chip ${searchType === 'pin' || (searchMode === 'manual' && manualSearchType === 'pin') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'pin' ? 'manual' : ''}`}
              onClick={() => handleChipClick('pin')}
            >
              <HiKey />
              <span>PIN</span>
            </button>
            <button
              type="button"
              className={`global-search-chip ${searchType === 'name' || (searchMode === 'manual' && manualSearchType === 'name') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'name' ? 'manual' : ''}`}
              onClick={() => handleChipClick('name')}
            >
              <HiUser />
              <span>Nombre</span>
            </button>
            <button
              type="button"
              className={`global-search-chip ${searchType === 'phone' || (searchMode === 'manual' && manualSearchType === 'phone') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'phone' ? 'manual' : ''}`}
              onClick={() => handleChipClick('phone')}
            >
              <HiPhone />
              <span>Teléfono</span>
            </button>
            <button
              type="button"
              className={`global-search-chip ${searchType === 'dni' || (searchMode === 'manual' && manualSearchType === 'dni') ? 'active' : ''} ${searchMode === 'manual' && manualSearchType === 'dni' ? 'manual' : ''}`}
              onClick={() => handleChipClick('dni')}
            >
              <HiIdentification />
              <span>DNI</span>
            </button>
            {searchMode === 'manual' && (
              <button
                type="button"
                className="global-search-chip-clear"
                onClick={handleClearFilter}
                aria-label="Quitar filtro y volver a automático"
                title="Quitar filtro y volver a automático"
              >
                ×
              </button>
            )}
          </div>

          <div className="global-search-modal-input-wrapper">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Busca productos o socios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="global-search-modal-input"
              autoFocus
            />
            <button 
              type="button"
              className="global-search-modal-qr-button"
              onClick={() => setShowQRScanner(true)}
              aria-label="Escanear código QR"
              title="Escanear código QR"
            >
              <HiQrCode />
            </button>
            {searchQuery.length > 0 && searchQuery.length < 3 && (
              <div className="global-search-modal-hint">
                Escribe al menos 3 caracteres para buscar
              </div>
            )}
            {searchType && searchQuery.length >= 3 && (
              <div className="global-search-modal-search-type">
                {searchType === 'name' && (
                  <>
                    <HiSearch className="global-search-modal-search-type-icon" />
                    Buscando por nombre {searchMode === 'manual' && '(manual)'}
                  </>
                )}
                {searchType === 'phone' && (
                  <>
                    <HiPhone className="global-search-modal-search-type-icon" />
                    Buscando por teléfono {searchMode === 'manual' && '(manual)'}
                  </>
                )}
                {searchType === 'pin' && (
                  <>
                    <HiKey className="global-search-modal-search-type-icon" />
                    Buscando por PIN {searchMode === 'manual' && '(manual)'}
                  </>
                )}
                {searchType === 'dni' && (
                  <>
                    <HiIdentification className="global-search-modal-search-type-icon" />
                    Buscando por DNI {searchMode === 'manual' && '(manual)'}
                  </>
                )}
                {searchType === 'any' && (
                  <>
                    <HiSearch className="global-search-modal-search-type-icon" />
                    Búsqueda general {searchMode === 'manual' && '(manual)'}
                  </>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="global-search-modal-loading">
              <Spinner size="lg" />
              <p>Buscando...</p>
            </div>
          )}

          {showEmptyState && (
            <div className="global-search-modal-empty">
              <p>No se encontraron resultados para "{searchQuery}"</p>
            </div>
          )}

          {!loading && hasResults && (
            <div className="global-search-modal-results">
              {products.length > 0 && (
                <div className="global-search-modal-section">
                  <h3 className="global-search-modal-section-title">
                    Productos ({products.length})
                  </h3>
                  <div className="global-search-modal-results-list">
                    {products.map((product) => (
                      <GlobalSearchResultItem
                        key={product.id}
                        type="product"
                        product={product}
                        onViewDetails={() => handleViewProductDetails(product.id)}
                        onDispense={() => handleDispenseProduct(product)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {customers.length > 0 && (
                <div className="global-search-modal-section">
                  <h3 className="global-search-modal-section-title">
                    Socios ({customers.length})
                  </h3>
                  <div className="global-search-modal-results-list">
                    {customers.map((customer) => (
                      <GlobalSearchResultItem
                        key={customer.id}
                        type="customer"
                        customer={customer}
                        onViewDetails={() => handleViewCustomerDetails(customer.id)}
                        onDispense={() => handleDispenseCustomer(customer)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showQRScanner && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onCustomerFound={handleQRScan}
        />
      )}
    </div>
  );
}
