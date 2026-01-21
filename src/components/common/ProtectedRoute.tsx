import { Navigate } from 'react-router-dom';
import { hasToken } from '@/services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige a la página de login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
