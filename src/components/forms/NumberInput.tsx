import { InputHTMLAttributes, forwardRef, useState, useEffect, useRef } from 'react';
import './Input.css';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  'data-tour'?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, value, onChange, min, max, step = 0.01, className = '', ...props }, ref) => {
    // Inicializar el estado local con el valor inicial del prop
    const getInitialValue = () => {
      if (value === undefined || value === null) {
        return '';
      }
      return value.toString();
    };
    
    // Estado local para mantener el valor como string mientras el usuario escribe
    const [localValue, setLocalValue] = useState<string>(getInitialValue);
    const isControlledRef = useRef(false);
    const lastPropValueRef = useRef<number | undefined>(value);

    // Sincronizar el estado local con el prop value cuando cambia externamente
    useEffect(() => {
      // Solo actualizar si el valor cambió desde fuera (no desde nuestro onChange)
      if (value !== lastPropValueRef.current) {
        lastPropValueRef.current = value;
        if (value === undefined || value === null) {
          setLocalValue('');
        } else {
          // Formatear el número manteniendo la precisión adecuada
          const formatted = value.toString();
          setLocalValue(formatted);
        }
        isControlledRef.current = false;
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Permitir valores vacíos, negativos, y decimales mientras se escribe
      if (inputValue === '' || inputValue === '-' || inputValue === '.') {
        setLocalValue(inputValue);
        // No llamar onChange todavía, esperar a onBlur o a que sea un número válido
        return;
      }

      // Validar que sea un número válido
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        setLocalValue(inputValue);
        // Llamar onChange para mantener sincronización, pero solo si el valor numérico cambió
        // Esto evita re-renders innecesarios cuando el usuario está escribiendo
        if (onChange && numValue !== lastPropValueRef.current) {
          isControlledRef.current = true;
          lastPropValueRef.current = numValue;
          onChange(numValue);
        }
      } else {
        // Si no es un número válido, mantener el valor anterior
        // Esto previene caracteres inválidos
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.trim();
      
      // Si está vacío, usar 0 o el mínimo si está definido
      if (inputValue === '' || inputValue === '-' || inputValue === '.') {
        const defaultValue = min !== undefined && min > 0 ? min : 0;
        setLocalValue(defaultValue.toString());
        if (onChange) {
          onChange(defaultValue);
        }
        return;
      }

      const numValue = parseFloat(inputValue);
      
      // Validar y ajustar según min/max
      if (!isNaN(numValue)) {
        let finalValue = numValue;
        
        if (min !== undefined && finalValue < min) {
          finalValue = min;
        }
        if (max !== undefined && finalValue > max) {
          finalValue = max;
        }
        
        // Actualizar el valor local con el valor final
        setLocalValue(finalValue.toString());
        
        // Solo llamar onChange si el valor cambió
        if (onChange && finalValue !== numValue) {
          onChange(finalValue);
        }
      } else {
        // Si no es válido, restaurar el último valor válido
        const lastValid = value ?? (min !== undefined && min > 0 ? min : 0);
        setLocalValue(lastValid.toString());
        if (onChange) {
          onChange(lastValid);
        }
      }

      // Llamar onBlur original si existe
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className={`form-field ${className}`}>
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {props.required && <span className="form-required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={`form-input ${error ? 'form-input-error' : ''}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
