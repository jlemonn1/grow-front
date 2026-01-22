import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCurrentUser, logout as logoutService } from '@/services/auth.service';
import { getCurrentAdmin } from '@/services/admin.service';
import { AdminPermission } from '@/types/models';
import type { Admin } from '@/types/models';

// Importar para guardar borrador antes de logout
let saveDraftBeforeLogout: (() => Promise<void>) | null = null;

export function setSaveDraftBeforeLogoutCallback(callback: () => Promise<void>) {
  saveDraftBeforeLogout = callback;
}

interface AuthContextType {
  currentUser: { username: string; isMainAdmin: boolean } | null;
  currentAdmin: Admin | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<{ username: string; isMainAdmin: boolean } | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const user = getCurrentUser();
      
      // Si hay usuario, intentar obtener información completa del admin
      if (user) {
        try {
          const admin = await getCurrentAdmin();
          setCurrentAdmin(admin);
          // Actualizar currentUser con la información del admin obtenido del backend
          setCurrentUser({
            username: admin.username,
            isMainAdmin: admin.isMainAdmin,
          });
        } catch (error) {
          // Si falla, usar la información del localStorage como fallback
          setCurrentUser(user);
          setCurrentAdmin(null);
        }
      } else {
        setCurrentUser(null);
        setCurrentAdmin(null);
      }
    } catch (error) {
      setCurrentUser(null);
      setCurrentAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Guardar borrador antes de cerrar sesión
    if (saveDraftBeforeLogout) {
      try {
        await saveDraftBeforeLogout();
      } catch (error) {
        console.error('Error al guardar borrador antes de logout:', error);
      }
    }
    
    logoutService();
    setCurrentUser(null);
    setCurrentAdmin(null);
  };

  const hasPermission = useCallback((permission: string): boolean => {
    // Si no hay usuario autenticado, no tiene permisos
    if (!currentUser && !currentAdmin) {
      return false;
    }

    // El admin principal siempre tiene todos los permisos
    // Verificar tanto en currentAdmin como en currentUser (fallback)
    if (currentAdmin?.isMainAdmin || currentUser?.isMainAdmin) {
      return true;
    }

    // Si no hay currentAdmin cargado, no podemos verificar permisos específicos
    if (!currentAdmin) {
      return false;
    }

    // Verificar si el permiso está en los permisos del admin
    return currentAdmin.permissions?.[permission] === true;
  }, [currentUser, currentAdmin]);

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentAdmin,
        isLoading,
        refreshUser,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}