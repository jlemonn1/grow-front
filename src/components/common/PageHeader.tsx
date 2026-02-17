import { HiArrowLeft } from 'react-icons/hi';
import { IconType } from 'react-icons';
import { Button } from './Button';
import { DraftSavingIndicator } from './DraftSavingIndicator';
import './PageHeader.css';

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: IconType;
  dataTour?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: PageHeaderAction;
  extraActions?: PageHeaderAction[];
  onBack?: () => void;
  isSaving?: boolean;
  dataTourBack?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  extraActions,
  onBack,
  isSaving,
  dataTourBack,
}: PageHeaderProps) {
  const actionButtons = [
    ...(action ? [action] : []),
    ...(extraActions ?? []),
  ];

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
              data-tour={dataTourBack}
            >
              <HiArrowLeft className="page-header-back-icon" aria-hidden="true" />
            </button>
          )}
          <div className="page-header-title-container">
            <h1 className="page-header-title" data-tour="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
          </div>
          <DraftSavingIndicator isSaving={isSaving} />
        </div>
        {actionButtons.length > 0 && (
          <div className="page-header-actions">
            {actionButtons.map((btn, index) => {
              const Icon = btn.icon;
              return (
                <Button
                  key={`${btn.label}-${index}`}
                  onClick={btn.onClick}
                  variant={btn.variant ?? 'primary'}
                  loading={btn.loading}
                  disabled={btn.disabled}
                  data-tour={btn.dataTour}
                >
                  {Icon && <Icon style={{ marginRight: '8px', fontSize: '18px' }} />}
                  {btn.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
