import { useState, useEffect, useCallback } from 'react';
import { Select, type SelectOption } from '@/components/forms/Select';
import { Button } from '@/components/common/Button';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { getPredefinedPeriod, formatPeriodLabel, type PredefinedPeriod } from '@/utils/dates';
import './PeriodSelector.css';

interface PeriodSelectorProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  enableComparison?: boolean;
  comparisonValue?: DateRange | null;
  onComparisonChange?: (range: DateRange | null) => void;
  className?: string;
}

const predefinedPeriodOptions: SelectOption[] = [
  { value: '', label: 'Personalizado' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'this_week', label: 'Esta Semana' },
  { value: 'last_week', label: 'Semana Pasada' },
  { value: 'this_month', label: 'Este Mes' },
  { value: 'last_month', label: 'Mes Pasado' },
  { value: 'this_year', label: 'Este Año' },
  { value: 'last_year', label: 'Año Pasado' },
];

const quickPeriods: { key: PredefinedPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'this_week', label: 'Esta Semana' },
  { key: 'last_week', label: 'Semana Pasada' },
  { key: 'this_month', label: 'Este Mes' },
  { key: 'last_month', label: 'Mes Pasado' },
  { key: 'this_year', label: 'Este Año' },
  { key: 'last_year', label: 'Año Pasado' },
];

export function PeriodSelector({
  value,
  onChange,
  enableComparison = false,
  comparisonValue,
  onComparisonChange,
  className = '',
}: PeriodSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);

  // Detectar si el rango actual coincide con un período predefinido
  useEffect(() => {
    if (!value) {
      setSelectedPeriod('');
      return;
    }

    const periods: PredefinedPeriod[] = [
      'today', 'yesterday', 'this_week', 'last_week',
      'this_month', 'last_month', 'this_year', 'last_year'
    ];

    for (const period of periods) {
      const predefined = getPredefinedPeriod(period);
      if (predefined.from === value.from && predefined.to === value.to) {
        setSelectedPeriod(period);
        return;
      }
    }

    setSelectedPeriod('');
  }, [value]);

  const handlePeriodChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const periodValue = e.target.value;
    setSelectedPeriod(periodValue);

    if (periodValue === '') {
      // Mantener el rango actual si ya hay uno personalizado
      return;
    }

    const range = getPredefinedPeriod(periodValue as PredefinedPeriod);
    onChange(range);
  }, [onChange]);

  const handleQuickPeriod = useCallback((period: PredefinedPeriod) => {
    const range = getPredefinedPeriod(period);
    setSelectedPeriod(period);
    onChange(range);
  }, [onChange]);

  const handleDateRangeChange = useCallback((range: DateRange | null) => {
    onChange(range);
    if (range) {
      setSelectedPeriod('');
    }
  }, [onChange]);

  const handleComparisonToggle = useCallback(() => {
    const newShowComparison = !showComparison;
    setShowComparison(newShowComparison);
    if (!newShowComparison && onComparisonChange) {
      onComparisonChange(null);
    }
  }, [showComparison, onComparisonChange]);

  const handleComparisonRangeChange = useCallback((range: DateRange | null) => {
    if (onComparisonChange) {
      onComparisonChange(range);
    }
  }, [onComparisonChange]);

  return (
    <div className={`period-selector ${className}`}>
      <div className="period-selector-main">
        {/* Selector de período predefinido */}
        <div className="period-selector-dropdown">
          <Select
            label="Período"
            options={predefinedPeriodOptions}
            value={selectedPeriod}
            onChange={handlePeriodChange}
            style={{ minWidth: '200px' }}
          />
        </div>

        {/* Botones de acceso rápido */}
        <div className="period-selector-quick-buttons">
          <div className="period-selector-quick-label">Acceso rápido:</div>
          <div className="period-selector-quick-list">
            {quickPeriods.map((period) => (
              <Button
                key={period.key}
                type="button"
                variant="secondary"
                onClick={() => handleQuickPeriod(period.key)}
                className={`period-quick-btn ${selectedPeriod === period.key ? 'active' : ''}`}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* DateRangePicker para períodos personalizados */}
        <div className="period-selector-custom">
          <DateRangePicker
            value={value || undefined}
            onChange={handleDateRangeChange}
          />
        </div>

        {/* Toggle de comparación */}
        {enableComparison && (
          <div className="period-selector-comparison-toggle">
            <Button
              type="button"
              variant="secondary"
              onClick={handleComparisonToggle}
              className={showComparison ? 'active' : ''}
            >
              {showComparison ? 'Ocultar Comparación' : 'Comparar con Otro Período'}
            </Button>
          </div>
        )}
      </div>

      {/* Selector de período de comparación */}
      {enableComparison && showComparison && (
        <div className="period-selector-comparison">
          <div className="period-selector-comparison-label">
            Período de Comparación:
          </div>
          <DateRangePicker
            value={comparisonValue || undefined}
            onChange={handleComparisonRangeChange}
          />
        </div>
      )}

      {/* Información de períodos seleccionados */}
      {(value || comparisonValue) && (
        <div className="period-selector-info">
          {value && (
            <div className="period-selector-info-item">
              <strong>Período:</strong> {formatPeriodLabel(value)}
            </div>
          )}
          {comparisonValue && (
            <div className="period-selector-info-item">
              <strong>Comparar con:</strong> {formatPeriodLabel(comparisonValue)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
