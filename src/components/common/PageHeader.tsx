import { HiArrowLeft } from 'react-icons/hi';
import { IconType } from 'react-icons';
import { Button } from './Button';
import { DraftSavingIndicator } from './DraftSavingIndicator';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: IconType;
  };
  onBack?: () => void;
  isSaving?: boolean;
}

export function PageHeader({ title, subtitle, action, onBack, isSaving }: PageHeaderProps) {
  const ActionIcon = action?.icon;
  
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-left">
          {onBack && (
            <button
              type="button"
              className="page-header-back-button"
              onClick={onBack}
              aria-label="Volver atrás"
            >
              <HiArrowLeft className="page-header-back-icon" aria-hidden="true" />
            </button>
          )}
          <div className="page-header-title-container">
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
          </div>
          <DraftSavingIndicator isSaving={isSaving} />
        </div>
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {ActionIcon && <ActionIcon style={{ marginRight: '8px', fontSize: '18px' }} />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
