import { useUI } from '@/context/ui.context';
import './ToastHost.css';

export function ToastHost() {
  const { toasts, hideToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => hideToast(toast.id)}
        >
          <div className="toast-content">
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                hideToast(toast.id);
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
