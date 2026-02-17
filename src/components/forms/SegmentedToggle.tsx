import React from 'react';
import './SegmentedToggle.css';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  label,
  id,
  required,
  disabled = false,
  className = ''
}: SegmentedToggleProps<T>) {
  const containerId = id || `segmented-toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`segmented-toggle-wrapper ${className}`}>
      {label && (
        <label className="segmented-toggle-label" htmlFor={containerId}>
          {label}
          {required && <span className="segmented-toggle-required"> *</span>}
        </label>
      )}
      <div 
        className="segmented-toggle-container" 
        id={containerId}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`segmented-toggle-option ${value === option.value ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            aria-pressed={value === option.value}
          >
            {option.icon && (
              <span className="segmented-toggle-icon">{option.icon}</span>
            )}
            <span className="segmented-toggle-text">{option.label}</span>
          </button>
        ))}
        <div className="segmented-toggle-indicator" />
      </div>
    </div>
  );
}

export default SegmentedToggle;
