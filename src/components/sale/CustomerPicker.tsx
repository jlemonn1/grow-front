import { memo, useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Input } from '@/components/forms/Input';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/models';
import './CustomerPicker.css';

interface CustomerPickerProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export interface CustomerPickerRef {
  focus: () => void;
}

const CustomerPickerComponent = forwardRef<CustomerPickerRef, CustomerPickerProps>(
  ({ selectedCustomer, onSelect }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'pin' | 'any' | null>(null);

  // Limpiar estados internos cuando selectedCustomer cambia a null
  useEffect(() => {
    if (!selectedCustomer) {
      setSearchQuery('');
      setResults([]);
      setShowResults(false);
      setSearchType(null);
      // Limpiar el input si existe
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [selectedCustomer]);

  // Detectar tipo de búsqueda
  const getSearchType = useCallback((query: string): 'name' | 'phone' | 'pin' | 'any' => {
    if (query.length < 3) return 'any';
    
    const trimmed = query.trim();
    const isAllNumbers = /^\d+$/.test(trimmed);
    const isAllLetters = /^[a-zA-Z]+$/.test(trimmed);
    const hasNumbersAndLetters = /[0-9]/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
    
    if (isAllNumbers) {
      return 'phone';
    } else if (isAllLetters) {
      return 'name';
    } else if (hasNumbersAndLetters && trimmed.length <= 4) {
      return 'pin';
    }
    
    return 'any';
  }, []);

  // Búsqueda con debounce - solo buscar si hay 3+ caracteres y no hay cliente seleccionado
  useEffect(() => {
    const trimmed = searchQuery.trim();
    
    // Si hay un cliente seleccionado y el query coincide con su nombre, no buscar
    if (selectedCustomer && trimmed === selectedCustomer.displayName) {
      setResults([]);
      setShowResults(false);
      setSearchType(null);
      return;
    }
    
    if (!trimmed) {
      setResults([]);
      setShowResults(false);
      setSearchType(null);
      return;
    }

    // Solo buscar si hay 3+ caracteres
    if (trimmed.length < 3) {
      setResults([]);
      setShowResults(false);
      setSearchType(null);
      return;
    }

    const detectedType = getSearchType(trimmed);
    setSearchType(detectedType);

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await customersService.search({ 
          q: trimmed, 
          page: 0, 
          size: 10 
        });
        setResults(response.content);
        setShowResults(true);
      } catch (error) {
        console.error('Error al buscar clientes:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, getSearchType, selectedCustomer]);

  const handleSelect = useCallback((customer: Customer) => {
    onSelect(customer);
    setSearchQuery(customer.displayName);
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
    <div className="customer-picker" role="combobox" aria-expanded={showResults} aria-haspopup="listbox">
      <div className="customer-picker-input-wrapper">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar por nombre, PIN o teléfono (mín. 3 caracteres)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Si hay un cliente seleccionado y el usuario empieza a escribir, limpiar selección
            if (selectedCustomer && e.target.value !== selectedCustomer.displayName) {
              onSelect(null);
            }
          }}
          onFocus={() => {
            // Solo mostrar resultados si hay búsqueda activa y no hay cliente seleccionado
            if (!selectedCustomer && results.length > 0 && searchQuery.length >= 3) {
              setShowResults(true);
            }
          }}
          onBlur={(e) => {
            // Pequeño delay para permitir que el click en el item se procese primero
            setTimeout(() => {
              // Si hay un cliente seleccionado, mantener su nombre en el input
              if (selectedCustomer) {
                setSearchQuery(selectedCustomer.displayName);
                setShowResults(false);
              }
            }, 200);
          }}
          aria-label="Buscar cliente"
          aria-autocomplete="list"
          aria-controls="customer-picker-list"
          aria-activedescendant={selectedCustomer ? `customer-${selectedCustomer.id}` : undefined}
        />
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <div className="customer-picker-hint">
            Escribe al menos 3 caracteres para buscar
          </div>
        )}
        {searchType && searchQuery.length >= 3 && (
          <div className="customer-picker-search-type">
            {searchType === 'name' && '🔍 Buscando por nombre'}
            {searchType === 'phone' && '📞 Buscando por teléfono'}
            {searchType === 'pin' && '🔑 Buscando por PIN'}
            {searchType === 'any' && '🔍 Buscando en todos los campos'}
          </div>
        )}
        {selectedCustomer && (
          <button 
            type="button"
            className="customer-picker-clear"
            onClick={handleClear}
            aria-label="Limpiar selección"
          >
            ×
          </button>
        )}
      </div>

      {showResults && (
        <div className="customer-picker-results" role="listbox" id="customer-picker-list">
          {loading ? (
            <div className="customer-picker-loading" role="status" aria-live="polite">
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="customer-picker-empty" role="status" aria-live="polite">
              No se encontraron clientes
            </div>
          ) : (
            <ul className="customer-picker-list">
              {results.map((customer) => (
                <li
                  key={customer.id}
                  id={`customer-${customer.id}`}
                  className={`customer-picker-item ${
                    selectedCustomer?.id === customer.id ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => {
                    // Prevenir que el blur del input cierre el dropdown antes del click
                    e.preventDefault();
                  }}
                  onClick={() => handleSelect(customer)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(customer);
                    }
                  }}
                  role="option"
                  aria-selected={selectedCustomer?.id === customer.id}
                  tabIndex={0}
                >
                  <div className="customer-picker-item-header">
                    <div className="customer-picker-item-name">{customer.displayName}</div>
                    {customer.pin && (
                      <span className="customer-picker-item-pin">{customer.pin}</span>
                    )}
                  </div>
                  <div className="customer-picker-item-details">
                    {customer.phone && (
                      <div className="customer-picker-item-phone">📞 {customer.phone}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedCustomer && !showResults && (
        <div className="customer-picker-selected">
          Cliente seleccionado: <strong>{selectedCustomer.displayName}</strong>
        </div>
      )}
    </div>
  );
  }
);

CustomerPickerComponent.displayName = 'CustomerPickerComponent';

export const CustomerPicker = memo(CustomerPickerComponent);
