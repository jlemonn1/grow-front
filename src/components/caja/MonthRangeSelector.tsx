import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import {
  getMonthName,
  getShortMonthName,
  getFirstDayOfMonthISOFrom,
  getLastDayOfMonthISO,
  addMonths,
  getTodayISO,
} from '@/utils/dateUtils';
import { HiChevronLeft, HiChevronRight, HiCalendar, HiXMark } from 'react-icons/hi2';
import './MonthRangeSelector.css';

export interface DateRange {
  desde: string;
  hasta: string;
}

interface MonthRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function MonthRangeSelector({ value, onChange }: MonthRangeSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customDesde, setCustomDesde] = useState(value.desde);
  const [customHasta, setCustomHasta] = useState(value.hasta);

  // Vista del año en modo expandido (empieza en el año del rango actual)
  const currentRangeDate = new Date(value.desde || getTodayISO());
  const [viewYear, setViewYear] = useState(currentRangeDate.getFullYear());

  // Detectar swipe en el compacto
  const touchStartX = useRef<number | null>(null);

  const handlePrevMonth = useCallback(() => {
    const desdeDate = new Date(value.desde);
    const prev = addMonths(desdeDate.getFullYear(), desdeDate.getMonth() + 1, -1);
    onChange({
      desde: getFirstDayOfMonthISOFrom(prev.year, prev.month),
      hasta: getLastDayOfMonthISO(prev.year, prev.month),
    });
  }, [value.desde, onChange]);

  const handleNextMonth = useCallback(() => {
    const desdeDate = new Date(value.desde);
    const next = addMonths(desdeDate.getFullYear(), desdeDate.getMonth() + 1, 1);
    onChange({
      desde: getFirstDayOfMonthISOFrom(next.year, next.month),
      hasta: getLastDayOfMonthISO(next.year, next.month),
    });
  }, [value.desde, onChange]);

  const handleMonthSelect = (month: number) => {
    onChange({
      desde: getFirstDayOfMonthISOFrom(viewYear, month),
      hasta: getLastDayOfMonthISO(viewYear, month),
    });
    setCustomMode(false);
    setExpanded(false);
  };

  const handleCustomApply = () => {
    if (customDesde && customHasta) {
      onChange({ desde: customDesde, hasta: customHasta });
      setExpanded(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) handleNextMonth();
      else handlePrevMonth();
    }
    touchStartX.current = null;
  };

  const desdeDate = new Date(value.desde);
  const displayMonth = getMonthName(desdeDate.getMonth() + 1);
  const displayYear = desdeDate.getFullYear();
  const isCurrentMonth =
    displayMonth === getMonthName(new Date().getMonth() + 1) &&
    displayYear === new Date().getFullYear();

  // Sincronizar custom inputs cuando cambia el value externo
  useEffect(() => {
    setCustomDesde(value.desde);
    setCustomHasta(value.hasta);
  }, [value.desde, value.hasta]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const today = new Date();

  return (
    <div className="month-range-selector">
      {/* Compacto */}
      <div
        className="month-range-compact"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="month-range-nav"
          onClick={handlePrevMonth}
          aria-label="Mes anterior"
        >
          <HiChevronLeft />
        </button>

        <button
          type="button"
          className={`month-range-display ${isCurrentMonth ? 'current' : ''}`}
          onClick={() => {
            setExpanded(!expanded);
            setCustomMode(false);
            setViewYear(displayYear);
          }}
        >
          <HiCalendar className="month-range-icon" />
          <span className="month-range-label">
            {displayMonth} {displayYear}
          </span>
          {!isCurrentMonth && (
            <span className="month-range-badge">{displayMonth.slice(0, 3)}</span>
          )}
        </button>

        <button
          type="button"
          className="month-range-nav"
          onClick={handleNextMonth}
          aria-label="Mes siguiente"
        >
          <HiChevronRight />
        </button>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="month-range-expanded">
          {/* Header del expanded: navegación de año */}
          <div className="month-range-expanded-header">
            <button
              type="button"
              className="month-range-nav small"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Año anterior"
            >
              <HiChevronLeft />
            </button>
            <span className="month-range-year-label">{viewYear}</span>
            <button
              type="button"
              className="month-range-nav small"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Año siguiente"
            >
              <HiChevronRight />
            </button>
            <button
              type="button"
              className="month-range-close"
              onClick={() => setExpanded(false)}
              aria-label="Cerrar"
            >
              <HiXMark />
            </button>
          </div>

          {/* Grid de meses */}
          <div className="month-range-grid">
            {months.map((m) => {
              const isSelected =
                !customMode &&
                displayYear === viewYear &&
                desdeDate.getMonth() + 1 === m;
              const isFuture =
                viewYear > today.getFullYear() ||
                (viewYear === today.getFullYear() && m > today.getMonth() + 1);
              return (
                <button
                  key={m}
                  type="button"
                  className={`month-range-cell ${isSelected ? 'selected' : ''} ${isFuture ? 'future' : ''}`}
                  onClick={() => handleMonthSelect(m)}
                  disabled={isFuture}
                >
                  <span className="month-range-cell-short">{getShortMonthName(m)}</span>
                  <span className="month-range-cell-full">{getMonthName(m)}</span>
                </button>
              );
            })}
          </div>

          {/* Toggle rango personalizado */}
          <div className="month-range-custom-toggle">
            <button
              type="button"
              className={`month-range-toggle-btn ${customMode ? 'active' : ''}`}
              onClick={() => setCustomMode((p) => !p)}
            >
              {customMode ? 'Ocultar rango personalizado' : 'Rango personalizado'}
            </button>
          </div>

          {/* Inputs de rango personalizado */}
          {customMode && (
            <div className="month-range-custom-inputs">
              <Input
                type="date"
                label="Desde"
                value={customDesde}
                onChange={(e) => setCustomDesde(e.target.value)}
              />
              <Input
                type="date"
                label="Hasta"
                value={customHasta}
                onChange={(e) => setCustomHasta(e.target.value)}
              />
              <div className="month-range-custom-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const now = new Date();
                    const defaultDesde = getFirstDayOfMonthISOFrom(now.getFullYear(), now.getMonth() + 1);
                    const defaultHasta = getLastDayOfMonthISO(now.getFullYear(), now.getMonth() + 1);
                    setCustomDesde(defaultDesde);
                    setCustomHasta(defaultHasta);
                  }}
                >
                  Mes actual
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCustomApply}
                  disabled={!customDesde || !customHasta}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
