import { TextareaHTMLAttributes, forwardRef } from 'react';
import './Textarea.css';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`form-field ${className}`}>
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {props.required && <span className="form-required">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`form-textarea ${error ? 'form-textarea-error' : ''}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
