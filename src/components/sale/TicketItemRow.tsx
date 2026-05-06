import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NumberInput } from '@/components/forms/NumberInput';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { formatMoney } from '@/utils/money';
import { getMeasurementShortLabel } from '@/utils/measurement';
import { useProductDispense } from '@/hooks/useProductDispense';
import type { TicketItem } from '@/types/models';
import './TicketItemRow.css';

interface TicketItemRowProps {
  item: TicketItem;
  index: number;
  onUpdate: (index: number, grams: number) => void;
  onRemove: (index: number) => void;
  onValidate: (index: number) => void;
  availableStock: number;
}

function TicketItemRowComponent({
  item,
  index,
  onUpdate,
  onRemove,
  onValidate,
  availableStock,
}: TicketItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Expandir automáticamente si hay un error
  useEffect(() => {
    if (item.validationState === 'invalid') {
      setIsExpanded(true);
    }
  }, [item.validationState]);

  const {
    grams: dispenseGrams,
    euros: dispenseEuros,
    setGrams: setDispenseGrams,
    setEuros: setDispenseEuros,
    effectivePricePerGram,
    measurementLabel,
  } = useProductDispense({
    product: item.product || null,
    availableStock,
    initialGrams: item.grams,
  });

  // Refs para evitar loops infinitos
  const isUpdatingFromGramsRef = useRef(false);
  const isUpdatingFromEurosRef = useRef(false);

  // Sincronizar gramos con el item cuando cambia externamente
  useEffect(() => {
    if (!isUpdatingFromGramsRef.current && !isUpdatingFromEurosRef.current) {
      if (Math.abs(dispenseGrams - item.grams) > 0.01) {
        isUpdatingFromGramsRef.current = true;
        setDispenseGrams(item.grams);
        requestAnimationFrame(() => {
          isUpdatingFromGramsRef.current = false;
        });
      }
    }
  }, [item.grams, dispenseGrams, setDispenseGrams]);

  // Sincronizar euros cuando cambian gramos o precio efectivo
  useEffect(() => {
    if (!isUpdatingFromGramsRef.current && !isUpdatingFromEurosRef.current) {
      const expectedEuros = item.grams * effectivePricePerGram;
      if (Math.abs(dispenseEuros - expectedEuros) > 0.01) {
        isUpdatingFromEurosRef.current = true;
        setDispenseEuros(expectedEuros);
        requestAnimationFrame(() => {
          isUpdatingFromEurosRef.current = false;
        });
      }
    }
  }, [item.grams, effectivePricePerGram, dispenseEuros, setDispenseEuros]);

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
    if (effectivePricePerGram > 0 && euros > 0) {
      const calculatedGrams = Math.round((euros / effectivePricePerGram) * 100) / 100;
      setDispenseGrams(calculatedGrams);
      // Pasar los euros exactos introducidos por el usuario para preservar el subtotal exacto
      onUpdate(index, calculatedGrams);
      onValidate(index);
    }
    requestAnimationFrame(() => {
      isUpdatingFromEurosRef.current = false;
    });
  }, [index, onUpdate, onValidate, setDispenseEuros, setDispenseGrams, effectivePricePerGram]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(index);
  }, [index, onRemove]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const isInvalid = item.validationState === 'invalid';
  const isChecking = item.validationState === 'checking';
  const measurementSuffix = getMeasurementShortLabel(item.product?.measurementType ?? 'WEIGHT');

  return (
    <div className={`ticket-item-row ${isExpanded ? 'ticket-item-row-expanded' : ''} ${isInvalid ? 'ticket-item-row-invalid' : ''} ${isChecking ? 'ticket-item-row-checking' : ''}`}>
      {!isExpanded && (
        <div className="ticket-item-row-summary" onClick={handleToggleExpand}>
          {item.product?.imageUrl && (
            <ProductImage
              imageUrl={item.product.imageUrl}
              alt={item.product?.name || 'Producto'}
              size="small"
              className="ticket-item-row-image"
            />
          )}
          <div className="ticket-item-row-summary-content">
            <div className="ticket-item-row-summary-name">{item.product?.name || 'Producto desconocido'}</div>
            <div className="ticket-item-row-summary-row">
              <div className="ticket-item-row-summary-highlights">
                <div className="ticket-item-row-summary-highlight">
                  <span className="ticket-item-row-summary-highlight-label">Dispensar</span>
                  <span className="ticket-item-row-summary-highlight-value ticket-item-row-summary-grams-value">
                    {item.grams.toFixed(2)}{measurementSuffix}
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
                <span className="ticket-item-row-summary-price-info">{formatMoney(effectivePricePerGram)}/{measurementSuffix}</span>
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
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="ticket-item-row-content">
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
              <div className="ticket-item-row-product-name">{item.product?.name || 'Producto desconocido'}</div>
              <div className="ticket-item-row-product-info">
                <span className="ticket-item-row-product-price">{formatMoney(effectivePricePerGram)}/{measurementSuffix}</span>
                <span className="ticket-item-row-product-stock">Disponible: {availableStock.toFixed(2)}{measurementSuffix}</span>
              </div>
            </div>

            <div className="ticket-item-row-subtotal">
              <div className="ticket-item-row-subtotal-label">Subtotal</div>
              <div className="ticket-item-row-subtotal-value">{formatMoney(item.subtotal)}</div>
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
                  <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

          <div className="ticket-item-row-middle">
            <div className="ticket-item-row-inputs">
              <div className="ticket-item-row-input-group">
                <label className="ticket-item-row-input-label">{measurementLabel.charAt(0).toUpperCase() + measurementLabel.slice(1)}</label>
                <NumberInput
                  value={dispenseGrams}
                  onChange={handleGramsChange}
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  error={isInvalid && item.errorMessage ? item.errorMessage : undefined}
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
        </div>
      )}

      {isInvalid && item.errorMessage && (
        <div className="ticket-item-row-error">{item.errorMessage}</div>
      )}
    </div>
  );
}

export const TicketItemRow = memo(TicketItemRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.productId === nextProps.item.productId &&
    prevProps.item.grams === nextProps.item.grams &&
    prevProps.item.pricePerGram === nextProps.item.pricePerGram &&
    prevProps.item.subtotal === nextProps.item.subtotal &&
    prevProps.item.validationState === nextProps.item.validationState &&
    prevProps.item.errorMessage === nextProps.item.errorMessage &&
    prevProps.index === nextProps.index &&
    prevProps.availableStock === nextProps.availableStock &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onValidate === nextProps.onValidate
  );
});
