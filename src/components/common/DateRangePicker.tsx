import React, { useState, useEffect } from 'react';
import { Input } from '@/components/forms/Input';
import { Button } from './Button';
import './DateRangePicker.css';

export interface DateRange {
  from: string; // ISO date string (YYYY-MM-DD)
  to: string; // ISO date string (YYYY-MM-DD)
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | null) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [fromDate, setFromDate] = useState(value?.from || '');
  const [toDate, setToDate] = useState(value?.to || '');
  const [error, setError] = useState<string | null>(null);

  const validateDates = (from: string, to: string): boolean => {
    if (!from || !to) {
      setError(null);
      return true;
    }

    const fromDateObj = new Date(from);
    const toDateObj = new Date(to);

    if (isNaN(fromDateObj.getTime())) {
      setError('Fecha inicial inválida');
      return false;
    }

    if (isNaN(toDateObj.getTime())) {
      setError('Fecha final inválida');
      return false;
    }

    if (fromDateObj > toDateObj) {
      setError('La fecha inicial no puede ser posterior a la fecha final');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value;
    setFromDate(newFrom);
    
    if (newFrom && toDate) {
      if (validateDates(newFrom, toDate)) {
        onChange({ from: newFrom, to: toDate });
      }
    } else if (!newFrom && !toDate) {
      onChange(null);
      setError(null);
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value;
    setToDate(newTo);
    
    if (fromDate && newTo) {
      if (validateDates(fromDate, newTo)) {
        onChange({ from: fromDate, to: newTo });
      }
    } else if (!fromDate && !newTo) {
      onChange(null);
      setError(null);
    }
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setError(null);
    onChange(null);
  };

  // Sincronizar con value externo
  useEffect(() => {
    if (value) {
      setFromDate(value.from || '');
      setToDate(value.to || '');
      if (value.from && value.to) {
        validateDates(value.from, value.to);
      }
    } else {
      setFromDate('');
      setToDate('');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.from, value?.to]);

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="date-range-picker-inputs">
        <Input
          type="date"
          label="Desde"
          value={fromDate}
          onChange={handleFromChange}
          style={{ maxWidth: '200px' }}
          error={error && error.includes('inicial') ? error : undefined}
        />
        <Input
          type="date"
          label="Hasta"
          value={toDate}
          onChange={handleToChange}
          style={{ maxWidth: '200px' }}
          error={error && (error.includes('final') || error.includes('posterior')) ? error : undefined}
        />
      </div>
      {error && !error.includes('inicial') && !error.includes('final') && (
        <div className="date-range-picker-error" style={{ 
          color: 'var(--color-error)', 
          fontSize: 'var(--font-size-sm)',
          marginTop: 'var(--spacing-xs)'
        }}>
          {error}
        </div>
      )}
      {(fromDate || toDate) && (
        <Button
          type="button"
          variant="secondary"
          onClick={handleClear}
          style={{ marginTop: 'var(--spacing-md)' }}
        >
          Limpiar fechas
        </Button>
      )}
    </div>
  );
}
