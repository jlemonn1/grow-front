import { memo, useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiQrCode } from 'react-icons/hi2';
import { HiSearch, HiPhone, HiKey, HiPencil, HiDocumentText } from 'react-icons/hi';
import { Input } from '@/components/forms/Input';
import { QRScannerModal } from '@/components/common/QRScannerModal';

import { AddNoteModal } from '@/components/customer/AddNoteModal';
import { customersService } from '@/services/customers.service';
import { formatMoney } from '@/utils/money';
import type { Customer } from '@/types/models';
import { CustomerAvatar } from '@/components/common/CustomerAvatar';
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
    const navigate = useNavigate();

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
  const [showQRScanner, setShowQRScanner] = useState(false);

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

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

  const handleQRScan = useCallback((customer: Customer) => {
    handleSelect(customer);
    setShowQRScanner(false);
  }, [handleSelect]);

  const handleCustomerChange = useCallback((updatedCustomer: Customer) => {
    onSelect(updatedCustomer);
  }, [onSelect]);

  return (
    <div className="customer-picker" role="combobox" aria-expanded={showResults} aria-haspopup="listbox">
      <div className="customer-picker-input-wrapper">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar por nombre, PIN o teléfono (mín. 3 caracteres)..."
          value={searchQuery}
          data-tour="customer-search-input"
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
          onBlur={() => {
            // Pequeño delay para permitir que el click en el item se procese primero
            setTimeout(() => {
              // Si hay un cliente seleccionado, mantener su nombre en el input
              if (selectedCustomer) {
                setSearchQuery(selectedCustomer.displayName);
                setShowResults(false);
              }
            }, 200);
          }}
          aria-label="Buscar socio"
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
            {searchType === 'name' && (
              <>
                <HiSearch className="customer-picker-search-type-icon" />
                Buscando por nombre
              </>
            )}
            {searchType === 'phone' && (
              <>
                <HiPhone className="customer-picker-search-type-icon" />
                Buscando por teléfono
              </>
            )}
            {searchType === 'pin' && (
              <>
                <HiKey className="customer-picker-search-type-icon" />
                Buscando por PIN
              </>
            )}
            {searchType === 'any' && (
              <>
                <HiSearch className="customer-picker-search-type-icon" />
                Buscando en todos los campos
              </>
            )}
          </div>
        )}
        <button 
          type="button"
          className="customer-picker-qr-button"
          onClick={() => setShowQRScanner(true)}
          aria-label="Escanear código QR"
          title="Escanear código QR"
        >
          <HiQrCode />
        </button>
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
              No se encontraron socios
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
                data-tour={`customer-row-${customer.id}`}
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
                <div className="customer-picker-item-content">
                  <CustomerAvatar
                    name={customer.displayName}
                    imageUrl={customer.profilePictureUrl}
                    size={36}
                    className="customer-picker-item-avatar"
                    tooltip={`Foto de ${customer.displayName}`}
                  />
                  <div className="customer-picker-item-body">
                    <div className="customer-picker-item-header">
                      <div className="customer-picker-item-name">{customer.displayName}</div>
                      {customer.pin && (
                        <span className="customer-picker-item-pin">{customer.pin}</span>
                      )}
                    </div>
                    <div className="customer-picker-item-details">
                      {customer.phone && (
                        <div className="customer-picker-item-phone">
                          <HiPhone className="customer-picker-item-phone-icon" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedCustomer && !showResults && (
        <div className="customer-picker-selected">
          <CustomerAvatar
            name={selectedCustomer.displayName}
            imageUrl={selectedCustomer.profilePictureUrl}
            size={40}
            className="customer-picker-selected-avatar"
            tooltip={`Foto de ${selectedCustomer.displayName}`}
          />
          <div className="customer-picker-selected-info">
            <span>
              Socio seleccionado: <strong>{selectedCustomer.displayName}</strong>
              {selectedCustomer.balance !== undefined && (
                <span className="customer-picker-balance">
                  {' '}• Saldo: {formatMoney(selectedCustomer.balance)}
                </span>
              )}
            </span>
          </div>
          <div className="customer-picker-actions">
            <button
              type="button"
              className="customer-picker-action-button"
              onClick={() => selectedCustomer && navigate(`/customers/${selectedCustomer.id}/edit`)}
              aria-label="Editar cliente"
              title="Editar cliente"
            >
              <HiPencil />
            </button>
            <button
              type="button"
              className="customer-picker-action-button"
              onClick={() => setShowAddNoteModal(true)}
              aria-label={selectedCustomer.notes ? "Editar nota" : "Añadir nota"}
              title={selectedCustomer.notes ? "Editar nota" : "Añadir nota"}
            >
              <HiDocumentText />
            </button>
          </div>
        </div>
      )}

      {showQRScanner && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onCustomerFound={handleQRScan}
        />
      )}



      {showAddNoteModal && selectedCustomer && (
        <AddNoteModal
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
          customer={selectedCustomer}
          onNoteAdded={handleCustomerChange}
        />
      )}
    </div>
  );
  }
);

CustomerPickerComponent.displayName = 'CustomerPickerComponent';

export const CustomerPicker = memo(CustomerPickerComponent);
