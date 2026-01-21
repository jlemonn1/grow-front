import { InputHTMLAttributes, forwardRef, memo } from 'react';
import './Input.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

const InputComponent = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
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
          className={`form-input ${error ? 'form-input-error' : ''}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);

InputComponent.displayName = 'Input';

// Memoizar el componente para evitar re-renders innecesarios
export const Input = memo(InputComponent);
