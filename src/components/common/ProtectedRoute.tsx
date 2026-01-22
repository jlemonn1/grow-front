import { Navigate } from 'react-router-dom';
import { hasToken } from '@/services/auth.service';
import { useVisitor } from '@/context/visitor.context';
import { useConfig } from '@/context/config.context';
import { Spinner } from '@/components/common/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige a la página de login.
 * Si necesita completar el onboarding, redirige a /onboarding.
 * Permite acceso en modo visitante sin token.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isVisitorMode } = useVisitor();
  const { needsOnboarding, loading: configLoading } = useConfig();
  
  // Permitir acceso si hay token o si está en modo visitante
  if (!hasToken() && !isVisitorMode) {
    return <Navigate to="/login" replace />;
  }

  // Mientras carga la configuración, mostrar spinner
  if (configLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Si necesita onboarding y está autenticado (no en modo visitante), redirigir a onboarding
  if (needsOnboarding && hasToken() && !isVisitorMode) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
