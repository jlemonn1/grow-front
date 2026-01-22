import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hasToken } from '@/services/auth.service';

interface VisitorContextType {
  isVisitorMode: boolean;
  activateVisitorMode: () => void;
  deactivateVisitorMode: () => void;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

const VISITOR_MODE_KEY = 'growshop_visitor_mode';

export function useVisitor() {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitor must be used within VisitorProvider');
  }
  return context;
}

interface VisitorProviderProps {
  children: ReactNode;
}

export function VisitorProvider({ children }: VisitorProviderProps) {
  const [isVisitorMode, setIsVisitorMode] = useState<boolean>(() => {
    // Cargar estado desde localStorage al inicializar
    const stored = localStorage.getItem(VISITOR_MODE_KEY);
    return stored === 'true';
  });

  const activateVisitorMode = () => {
    setIsVisitorMode(true);
    localStorage.setItem(VISITOR_MODE_KEY, 'true');
  };

  const deactivateVisitorMode = () => {
    setIsVisitorMode(false);
    localStorage.removeItem(VISITOR_MODE_KEY);
  };

  // Sincronizar con localStorage cuando cambia el estado
  useEffect(() => {
    if (isVisitorMode) {
      localStorage.setItem(VISITOR_MODE_KEY, 'true');
    } else {
      localStorage.removeItem(VISITOR_MODE_KEY);
    }
  }, [isVisitorMode]);

  // Desactivar modo visitante automáticamente si hay un token válido
  useEffect(() => {
    if (isVisitorMode && hasToken()) {
      setIsVisitorMode(false);
      localStorage.removeItem(VISITOR_MODE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

  return (
    <VisitorContext.Provider
      value={{
        isVisitorMode,
        activateVisitorMode,
        deactivateVisitorMode,
      }}
    >
      {children}
    </VisitorContext.Provider>
  );
}
