import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCurrentUser, logout as logoutService, hasToken } from '@/services/auth.service';
import { getCurrentAdmin } from '@/services/admin.service';
import type { Admin } from '@/types/models';
import type { ApiError } from '@/types/api';

// Importar para guardar borrador antes de logout
let saveDraftBeforeLogout: (() => Promise<void>) | null = null;

export function setSaveDraftBeforeLogoutCallback(callback: () => Promise<void>) {
  saveDraftBeforeLogout = callback;
}

// Callback global para manejar desautenticación
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(callback: () => void) {
  onUnauthorizedCallback = callback;
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

  const logout = useCallback(async () => {
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
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Si no hay token, limpiar estado y salir
      if (!hasToken()) {
        setCurrentUser(null);
        setCurrentAdmin(null);
        setIsLoading(false);
        return;
      }

      const user = getCurrentUser();
      
      // Si hay usuario, intentar obtener información completa del admin
      if (user) {
        try {
          const admin = await getCurrentAdmin();
          console.log('[AuthContext] Admin cargado:', admin.username, 'colorAccessibility:', admin.colorAccessibility);
          setCurrentAdmin(admin);
          // Actualizar currentUser con la información del admin obtenido del backend
          setCurrentUser({
            username: admin.username,
            isMainAdmin: admin.isMainAdmin,
          });
        } catch (error: any) {
          // Si el error es 401 (no autorizado), 400 (bad request - token inválido) o 404 (admin no encontrado), hacer logout automático
          const apiError = error as ApiError;
          if (apiError?.status === 401 || apiError?.status === 400 || apiError?.status === 404) {
            // Token expirado, inválido o admin no encontrado - hacer logout automático
            console.warn('Token inválido, expirado o admin no encontrado. Cerrando sesión automáticamente.');
            await logout();
            // Disparar callback global si existe
            if (onUnauthorizedCallback) {
              onUnauthorizedCallback();
            }
            // Disparar evento para redirección
            window.dispatchEvent(new CustomEvent('auth:logout-complete'));
            return;
          }
          
          // Para otros errores (red, etc.), limpiar estado pero no hacer logout
          // para permitir reintentos si es un problema temporal
          setCurrentUser(null);
          setCurrentAdmin(null);
        }
      } else {
        // No hay usuario en localStorage, limpiar estado
        setCurrentUser(null);
        setCurrentAdmin(null);
      }
    } catch (error) {
      // Error general, limpiar estado
      setCurrentUser(null);
      setCurrentAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

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

  // Escuchar eventos de desautenticación desde http.ts
  useEffect(() => {
    const handleUnauthorized = async () => {
      // Si hay un token pero recibimos un 401, hacer logout
      if (hasToken()) {
        await logout();
        // Disparar evento para redirección
        window.dispatchEvent(new CustomEvent('auth:logout-complete'));
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

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