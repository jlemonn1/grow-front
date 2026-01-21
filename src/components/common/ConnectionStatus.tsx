import { useUI } from '@/context/ui.context';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const { isOnline } = useUI();

  if (isOnline) {
    return null;
  }

  return (
    <div className="connection-status" role="alert" aria-live="assertive">
      <div className="connection-status-content">
        <span className="connection-status-led"></span>
        <span className="connection-status-message">
          Sin conexión. Verifica tu conexión a internet.
        </span>
      </div>
    </div>
  );
}
