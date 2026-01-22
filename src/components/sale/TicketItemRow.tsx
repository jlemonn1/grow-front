import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { NumberInput } from '@/components/forms/NumberInput';
import { Select, type SelectOption } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { formatMoney } from '@/utils/money';
import { useProductDispense } from '@/hooks/useProductDispense';
import type { TicketItem } from '@/types/models';
import './TicketItemRow.css';

interface TicketItemRowProps {
  item: TicketItem;
  index: number;
  onUpdate: (index: number, grams: number) => void;
  onUpdateDiscount: (index: number, discount: number | undefined, discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | undefined) => void;
  onRemove: (index: number) => void;
  onValidate: (index: number) => void;
  availableStock: number;
}

function TicketItemRowComponent({
  item,
  index,
  onUpdate,
  onUpdateDiscount,
  onRemove,
  onValidate,
  availableStock,
}: TicketItemRowProps) {
  const [showDiscount, setShowDiscount] = useState(!!item.discount || !!item.discountType);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Expandir automáticamente si hay un error
  useEffect(() => {
    if (item.validationState === 'invalid') {
      setIsExpanded(true);
    }
  }, [item.validationState]);
  
  // Usar el hook de dispense para sincronizar gramos y euros
  const {
    grams: dispenseGrams,
    euros: dispenseEuros,
    setGrams: setDispenseGrams,
    setEuros: setDispenseEuros,
    effectivePricePerGram,
  } = useProductDispense({
    product: item.product || null,
    availableStock,
    initialGrams: item.grams,
  });

  // Refs para evitar loops infinitos
  const isUpdatingFromGramsRef = useRef(false);
  const isUpdatingFromEurosRef = useRef(false);

  // Sincronizar con el item cuando cambia externamente (por ejemplo, cuando se aplica un descuento)
  useEffect(() => {
    if (!isUpdatingFromGramsRef.current && !isUpdatingFromEurosRef.current) {
      // Solo sincronizar si hay una diferencia significativa (más de 0.01)
      if (Math.abs(dispenseGrams - item.grams) > 0.01) {
        isUpdatingFromGramsRef.current = true;
        setDispenseGrams(item.grams);
        requestAnimationFrame(() => {
          isUpdatingFromGramsRef.current = false;
        });
      }
    }
  }, [item.grams, item.subtotal, effectivePricePerGram, dispenseGrams, setDispenseGrams]);

  // Sincronizar euros cuando cambia el subtotal (por ejemplo, cuando se aplica un descuento)
  useEffect(() => {
    if (!isUpdatingFromGramsRef.current && !isUpdatingFromEurosRef.current) {
      // El subtotal puede incluir descuentos, pero para el cálculo de euros usamos el precio base
      const expectedEuros = item.grams * effectivePricePerGram;
      if (Math.abs(dispenseEuros - expectedEuros) > 0.01) {
        isUpdatingFromEurosRef.current = true;
        setDispenseEuros(expectedEuros);
        requestAnimationFrame(() => {
          isUpdatingFromEurosRef.current = false;
        });
      }
    }
  }, [item.grams, item.subtotal, effectivePricePerGram, dispenseEuros, setDispenseEuros]);

  const handleGramsChange = useCallback((grams: number) => {
    if (isUpdatingFromEurosRef.current) {
      return;
    }
    isUpdatingFromGramsRef.current = true;
    setDispenseGrams(grams);
    onUpdate(index, grams);
    onValidate(index);
    requestAnimationFrame(() => {
      isUpdatingFromGramsRef.current = false;
    });
  }, [index, onUpdate, onValidate, setDispenseGrams]);

  const handleEurosChange = useCallback((euros: number) => {
    if (isUpdatingFromGramsRef.current) {
      return;
    }
    isUpdatingFromEurosRef.current = true;
    setDispenseEuros(euros);
    // Calcular gramos desde euros usando el mismo método que el hook
    if (effectivePricePerGram > 0 && euros > 0) {
      const calculatedGrams = Math.round((euros / effectivePricePerGram) * 100) / 100;
      // Actualizar también el estado interno del hook para mantener sincronización
      setDispenseGrams(calculatedGrams);
      onUpdate(index, calculatedGrams);
      onValidate(index);
    }
    requestAnimationFrame(() => {
      isUpdatingFromEurosRef.current = false;
    });
  }, [index, onUpdate, onValidate, setDispenseEuros, setDispenseGrams, effectivePricePerGram]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se expanda al hacer clic en eliminar
    onRemove(index);
  }, [index, onRemove]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleDiscountTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onUpdateDiscount(index, undefined, undefined);
      setShowDiscount(false);
    } else {
      const discountType = value as 'PERCENTAGE' | 'FIXED_AMOUNT';
      onUpdateDiscount(index, item.discount || 0, discountType);
      setShowDiscount(true);
    }
  }, [index, item.discount, onUpdateDiscount]);

  const handleDiscountValueChange = useCallback((discount: number) => {
    if (discount <= 0 || isNaN(discount)) {
      onUpdateDiscount(index, undefined, item.discountType);
    } else {
      onUpdateDiscount(index, discount, item.discountType);
    }
  }, [index, item.discountType, onUpdateDiscount]);

  const toggleDiscount = useCallback(() => {
    if (showDiscount) {
      onUpdateDiscount(index, undefined, undefined);
      setShowDiscount(false);
    } else {
      setShowDiscount(true);
    }
  }, [index, showDiscount, onUpdateDiscount]);

  const isInvalid = item.validationState === 'invalid';
  const isChecking = item.validationState === 'checking';

  const discountTypeOptions: SelectOption[] = [
    { value: '', label: 'Sin descuento' },
    { value: 'PERCENTAGE', label: 'Porcentaje (%)' },
    { value: 'FIXED_AMOUNT', label: 'Monto fijo (€)' },
  ];

  const maxDiscount = item.discountType === 'FIXED_AMOUNT' 
    ? (item.subtotalBeforeDiscount || item.grams * item.pricePerGram)
    : 100;

  return (
    <div className={`ticket-item-row ${isExpanded ? 'ticket-item-row-expanded' : ''} ${isInvalid ? 'ticket-item-row-invalid' : ''} ${isChecking ? 'ticket-item-row-checking' : ''}`}>
      {/* Modo resumen (colapsado) */}
      {!isExpanded && (
        <div 
          className="ticket-item-row-summary"
          onClick={handleToggleExpand}
        >
          {item.product?.imageUrl && (
            <ProductImage 
              imageUrl={item.product.imageUrl} 
              alt={item.product?.name || 'Producto'}
              size="small"
              className="ticket-item-row-image"
            />
          )}
          <div className="ticket-item-row-summary-content">
            <div className="ticket-item-row-summary-name">
              {item.product?.name || 'Producto desconocido'}
            </div>
            <div className="ticket-item-row-summary-row">
              <div className="ticket-item-row-summary-highlights">
                <div className="ticket-item-row-summary-highlight">
                  <span className="ticket-item-row-summary-highlight-label">Dispensar</span>
                  <span className="ticket-item-row-summary-highlight-value ticket-item-row-summary-grams-value">
                    {item.grams.toFixed(2)}g
                  </span>
                </div>
                <div className="ticket-item-row-summary-highlight">
                  <span className="ticket-item-row-summary-highlight-label">Cuesta</span>
                  <span className="ticket-item-row-summary-highlight-value ticket-item-row-summary-euros-value">
                    {formatMoney(item.subtotal)}
                  </span>
                </div>
              </div>
              <div className="ticket-item-row-summary-details">
                <span className="ticket-item-row-summary-price-info">
                  {formatMoney(effectivePricePerGram)}/g
                </span>
                {item.subtotalBeforeDiscount && item.subtotalBeforeDiscount !== item.subtotal && (
                  <span className="ticket-item-row-summary-discount-info">
                    Descuento aplicado
                  </span>
                )}
              </div>
              <div className="ticket-item-row-summary-actions">
                <Button
                  variant="danger"
                  onClick={handleRemove}
                  className="ticket-item-row-remove"
                  aria-label="Eliminar producto"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
          <div className="ticket-item-row-expand-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Modo expandido (editable) */}
      {isExpanded && (
        <div className="ticket-item-row-content">
          {/* Sección superior: Información del producto y acciones */}
          <div className="ticket-item-row-top">
            {item.product?.imageUrl && (
              <ProductImage 
                imageUrl={item.product.imageUrl} 
                alt={item.product?.name || 'Producto'}
                size="small"
                className="ticket-item-row-image"
              />
            )}
            <div className="ticket-item-row-product">
              <div className="ticket-item-row-product-name">
                {item.product?.name || 'Producto desconocido'}
              </div>
              <div className="ticket-item-row-product-info">
                <span className="ticket-item-row-product-price">
                  {formatMoney(effectivePricePerGram)}/g
                </span>
                <span className="ticket-item-row-product-stock">
                  Disponible: {availableStock.toFixed(2)}g
                </span>
              </div>
            </div>

            <div className="ticket-item-row-subtotal">
              <div className="ticket-item-row-subtotal-label">Subtotal</div>
              {item.subtotalBeforeDiscount && item.subtotalBeforeDiscount !== item.subtotal ? (
                <>
                  <div className="ticket-item-row-subtotal-original">
                    {formatMoney(item.subtotalBeforeDiscount)}
                  </div>
                  <div className="ticket-item-row-subtotal-value">
                    {formatMoney(item.subtotal)}
                  </div>
                </>
              ) : (
                <div className="ticket-item-row-subtotal-value">
                  {formatMoney(item.subtotal)}
                </div>
              )}
            </div>

            <div className="ticket-item-row-actions">
              <Button
                variant="secondary"
                onClick={handleToggleExpand}
                className="ticket-item-row-collapse"
                aria-label="Colapsar"
                size="small"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              <Button
                variant="danger"
                onClick={handleRemove}
                className="ticket-item-row-remove"
                aria-label="Eliminar producto"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Sección media: Edición de gramos y euros */}
          <div className="ticket-item-row-middle">
            <div className="ticket-item-row-inputs">
              <div className="ticket-item-row-input-group">
                <label className="ticket-item-row-input-label">Gramos</label>
                <NumberInput
                  value={dispenseGrams}
                  onChange={handleGramsChange}
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  error={isInvalid && item.errorMessage?.includes('gramos') ? item.errorMessage : undefined}
                  className="ticket-item-row-input"
                />
              </div>
              <div className="ticket-item-row-input-separator">×</div>
              <div className="ticket-item-row-input-group">
                <label className="ticket-item-row-input-label">Total (€)</label>
                <NumberInput
                  value={dispenseEuros}
                  onChange={handleEurosChange}
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  className="ticket-item-row-input"
                />
              </div>
            </div>
          </div>

          {/* Sección inferior: Descuentos */}
          <div className="ticket-item-row-bottom">
            <div className="ticket-item-row-discount">
              <Button
                variant="secondary"
                onClick={toggleDiscount}
                className="ticket-item-row-discount-toggle"
                size="small"
              >
                {showDiscount ? 'Ocultar descuento' : 'Añadir descuento'}
              </Button>
              {showDiscount && (
                <div className="ticket-item-row-discount-controls">
                  <Select
                    value={item.discountType || ''}
                    onChange={handleDiscountTypeChange}
                    options={discountTypeOptions}
                    className="ticket-item-row-discount-type"
                  />
                  {item.discountType && (
                    <NumberInput
                      value={item.discount || 0}
                      onChange={handleDiscountValueChange}
                      min={0}
                      max={maxDiscount}
                      step={item.discountType === 'PERCENTAGE' ? 1 : 0.01}
                      placeholder={item.discountType === 'PERCENTAGE' ? '%' : '€'}
                      className="ticket-item-row-discount-value"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isInvalid && item.errorMessage && (
        <div className="ticket-item-row-error">
          {item.errorMessage}
        </div>
      )}
    </div>
  );
}

export const TicketItemRow = memo(TicketItemRowComponent, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.item.productId === nextProps.item.productId &&
    prevProps.item.grams === nextProps.item.grams &&
    prevProps.item.subtotal === nextProps.item.subtotal &&
    prevProps.item.discount === nextProps.item.discount &&
    prevProps.item.discountType === nextProps.item.discountType &&
    prevProps.item.validationState === nextProps.item.validationState &&
    prevProps.item.errorMessage === nextProps.item.errorMessage &&
    prevProps.index === nextProps.index &&
    prevProps.availableStock === nextProps.availableStock &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onUpdateDiscount === nextProps.onUpdateDiscount &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onValidate === nextProps.onValidate
  );
});
