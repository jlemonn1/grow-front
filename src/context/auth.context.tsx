import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, logout as logoutService } from '@/services/auth.service';
import { getCurrentAdmin } from '@/services/admin.service';
import type { Admin } from '@/types/models';

interface AuthContextType {
  currentUser: { username: string; isMainAdmin: boolean } | null;
  currentAdmin: Admin | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
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

  const logout = () => {
    logoutService();
    setCurrentUser(null);
    setCurrentAdmin(null);
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}