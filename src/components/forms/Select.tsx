import { SelectHTMLAttributes, forwardRef } from 'react';
import { HiXCircle } from 'react-icons/hi2';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="select-wrapper">
        {label && (
          <label htmlFor={props.id} className="select-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`select ${error ? 'select-error' : ''} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="select-error-message">
            <HiXCircle className="select-error-icon" aria-hidden="true" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
