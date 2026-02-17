import { HiCheckCircle, HiXCircle, HiExclamationTriangle, HiInformationCircle } from 'react-icons/hi2';
import { useUI } from '@/context/ui.context';
import './ToastHost.css';

const TOAST_ICONS = {
  success: HiCheckCircle,
  error: HiXCircle,
  warning: HiExclamationTriangle,
  info: HiInformationCircle,
};

export function ToastHost() {
  const { toasts, hideToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host">
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type] || HiInformationCircle;
        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => hideToast(toast.id)}
          >
            <div className="toast-content">
              <Icon className="toast-icon" aria-hidden="true" />
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
        );
      })}
    </div>
  );
}
