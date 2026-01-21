import { Select, type SelectOption } from '@/components/forms/Select';
import './MonthSelector.css';

interface MonthSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  className?: string;
}

export function MonthSelector({ year, month, onChange, className = '' }: MonthSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  
  const months: SelectOption[] = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const yearOptions: SelectOption[] = years.map(y => ({
    value: y.toString(),
    label: y.toString(),
  }));

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    onChange(newYear, month);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    onChange(year, newMonth);
  };

  return (
    <div className={`month-selector ${className}`}>
      <Select
        label="Año"
        options={yearOptions}
        value={year.toString()}
        onChange={handleYearChange}
        style={{ minWidth: '100px' }}
      />
      <Select
        label="Mes"
        options={months}
        value={month.toString()}
        onChange={handleMonthChange}
        style={{ minWidth: '150px' }}
      />
    </div>
  );
}
