import { ReactNode } from 'react';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import './FormSection.css';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`form-section ${className}`}>
      {title && (
        <div className="form-section-header">
          <h3 className="form-section-title">{title}</h3>
          {description && (
            <p className="form-section-description">
              <HiOutlineInformationCircle className="form-section-icon" />
              {description}
            </p>
          )}
        </div>
      )}
      <div className="form-section-content">
        {children}
      </div>
    </div>
  );
}
