import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { setConnectionStatusCallback } from '@/services/http';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ModalConfig {
  title: string;
  content: ReactNode;
  onClose?: () => void;
}

interface UIContextType {
  toasts: Toast[];
  activeModal: ModalConfig | null;
  globalLoading: boolean;
  isOnline: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  setGlobalLoading: (loading: boolean) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIContextProvider');
  }
  return context;
}

interface UIContextProviderProps {
  children: ReactNode;
}

export function UIContextProvider({ children }: UIContextProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeModal, setActiveModal] = useState<ModalConfig | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openModal = useCallback((config: ModalConfig) => {
    setActiveModal(config);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const setOnlineStatus = useCallback((online: boolean) => {
    setIsOnline(online);
  }, []);

  // Usar ref para showToast en los event listeners
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Configurar callback para cambios de conexión desde http.ts
  useEffect(() => {
    setConnectionStatusCallback((online: boolean) => {
      if (!online && isOnline) {
        setWasOffline(true);
      } else if (online && !isOnline && wasOffline) {
        showToastRef.current('Conexión restaurada', 'success');
        setWasOffline(false);
      }
      setIsOnline(online);
    });

    // Escuchar eventos del navegador
    const handleOnline = () => {
      if (wasOffline) {
        showToastRef.current('Conexión restaurada', 'success');
        setWasOffline(false);
      }
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      showToastRef.current('Conexión perdida. Algunas funciones pueden no estar disponibles.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      setConnectionStatusCallback(() => {});
    };
  }, [isOnline, wasOffline]);

  return (
    <UIContext.Provider
      value={{
        toasts,
        activeModal,
        globalLoading,
        isOnline,
        showToast,
        hideToast,
        openModal,
        closeModal,
        setGlobalLoading,
        setOnlineStatus,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
