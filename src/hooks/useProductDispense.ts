import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Product } from '@/types/models';
import { getMeasurementLongLabel, getMeasurementShortLabel } from '@/utils/measurement';

interface UseProductDispenseOptions {
  product: Product | null;
  availableStock: number;
  initialGrams?: number;
}

interface UseProductDispenseReturn {
  grams: number;
  euros: number;
  error: string | undefined;
  setGrams: (value: number) => void;
  setEuros: (value: number) => void;
  isValid: boolean;
  effectivePricePerGram: number;
  measurementLabel: string;
  measurementShortLabel: string;
}

/**
 * Precio efectivo por unidad de medicion.
 * Las ofertas ya no se aplican por producto, solo a nivel total de venta.
 */
function calculateEffectivePricePerGram(product: Product): number {
  return Math.round(product.pricePerGram * 100) / 100;
}

/**
 * Hook para manejar la sincronización entre gramos y euros al dispensar un producto
 */
export function useProductDispense({
  product,
  availableStock,
  initialGrams = 0,
}: UseProductDispenseOptions): UseProductDispenseReturn {
  const [grams, setGramsState] = useState<number>(initialGrams);
  const [euros, setEurosState] = useState<number>(0);
  const [error, setError] = useState<string | undefined>();
  
  // Ref para evitar loops infinitos en la sincronización
  const isUpdatingFromGramsRef = useRef(false);
  const isUpdatingFromEurosRef = useRef(false);
  
  // Calcular precio efectivo
  const effectivePricePerGram = product ? calculateEffectivePricePerGram(product) : 0;
  
  // Etiquetas de medición dinámicas
  const measurementType = product?.measurementType ?? 'WEIGHT';
  const measurementLabel = useMemo(() => getMeasurementLongLabel(measurementType), [measurementType]);
  const measurementShortLabel = useMemo(() => getMeasurementShortLabel(measurementType), [measurementType]);
  
  // Función helper para redondear a 2 decimales
  const roundToTwoDecimals = useCallback((value: number): number => {
    return Math.round(value * 100) / 100;
  }, []);

  // Inicializar euros cuando cambia el producto o los gramos iniciales
  useEffect(() => {
    if (product && effectivePricePerGram > 0) {
      // Si initialGrams es 0 o no se proporciona, usar 1 gramo por defecto (si hay stock)
      const defaultGrams = initialGrams > 0 
        ? initialGrams 
        : (availableStock > 0 ? 1 : 0);
      
      if (defaultGrams > 0) {
        const calculatedEuros = roundToTwoDecimals(defaultGrams * effectivePricePerGram);
        setGramsState(roundToTwoDecimals(defaultGrams));
        setEurosState(calculatedEuros);
        setError(undefined);
      } else {
        setGramsState(0);
        setEurosState(0);
        setError(undefined);
      }
    } else {
      setGramsState(0);
      setEurosState(0);
      setError(undefined);
    }
  }, [product?.id, initialGrams, effectivePricePerGram, availableStock, roundToTwoDecimals]);
  
  // Validar cantidad contra stock disponible
  const validateGrams = useCallback((gramsValue: number): string | undefined => {
    if (gramsValue <= 0) {
      return `La cantidad debe ser mayor a 0`;
    }
    
    if (gramsValue > availableStock) {
      return `Stock insuficiente. Disponible: ${availableStock.toFixed(2)}${measurementShortLabel}`;
    }
    
    return undefined;
  }, [availableStock, measurementShortLabel]);
  
  // Actualizar gramos y sincronizar euros
  const setGrams = useCallback((value: number) => {
    if (isUpdatingFromEurosRef.current) {
      return; // Evitar loop si viene de actualización de euros
    }
    
    isUpdatingFromGramsRef.current = true;
    
    // Redondear gramos a 2 decimales
    const roundedGrams = roundToTwoDecimals(value);
    
    // Validar
    const validationError = validateGrams(roundedGrams);
    setError(validationError);
    
    // Actualizar gramos
    setGramsState(roundedGrams);
    
    // Calcular euros
    if (effectivePricePerGram > 0 && roundedGrams > 0) {
      const calculatedEuros = roundToTwoDecimals(roundedGrams * effectivePricePerGram);
      setEurosState(calculatedEuros);
    } else {
      setEurosState(0);
    }
    
    // Reset flag usando requestAnimationFrame para mejor sincronización
    requestAnimationFrame(() => {
      isUpdatingFromGramsRef.current = false;
    });
  }, [effectivePricePerGram, validateGrams, roundToTwoDecimals]);
  
  // Actualizar euros y sincronizar gramos
  const setEuros = useCallback((value: number) => {
    if (isUpdatingFromGramsRef.current) {
      return; // Evitar loop si viene de actualización de gramos
    }
    
    isUpdatingFromEurosRef.current = true;
    
    // Redondear euros a 2 decimales
    const roundedEuros = roundToTwoDecimals(value);
    
    // Calcular gramos desde euros
    if (effectivePricePerGram > 0 && roundedEuros > 0) {
      const calculatedGrams = roundToTwoDecimals(roundedEuros / effectivePricePerGram);
      
      // Validar gramos calculados
      const validationError = validateGrams(calculatedGrams);
      setError(validationError);
      
      // Actualizar ambos valores
      setGramsState(calculatedGrams);
      setEurosState(roundedEuros);
    } else {
      setGramsState(0);
      setEurosState(0);
      setError(roundedEuros > 0 ? `El precio por ${measurementLabel} debe ser mayor a 0` : undefined);
    }
    
    // Reset flag usando requestAnimationFrame para mejor sincronización
    requestAnimationFrame(() => {
      isUpdatingFromEurosRef.current = false;
    });
  }, [effectivePricePerGram, validateGrams, roundToTwoDecimals]);
  
  const isValid = grams > 0 && error === undefined;
  
  return {
    grams,
    euros,
    error,
    setGrams,
    setEuros,
    isValid,
    effectivePricePerGram,
    measurementLabel,
    measurementShortLabel,
  };
}
