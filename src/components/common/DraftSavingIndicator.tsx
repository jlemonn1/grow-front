import { Spinner } from './Spinner';
import './DraftSavingIndicator.css';

interface DraftSavingIndicatorProps {
  isSaving?: boolean;
}

export function DraftSavingIndicator({ isSaving }: DraftSavingIndicatorProps) {
  if (!isSaving) {
    return null;
  }

  return (
    <div className="draft-saving-indicator" aria-live="polite" aria-label="Guardando borrador">
      <Spinner size="sm" />
      <span className="draft-saving-indicator-text">Guardando...</span>
    </div>
  );
}
