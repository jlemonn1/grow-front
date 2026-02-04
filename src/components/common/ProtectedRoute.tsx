import { Navigate, useLocation } from 'react-router-dom';
import { hasToken } from '@/services/auth.service';
import { useVisitor } from '@/context/visitor.context';
import { useConfig } from '@/context/config.context';
import { useAuth } from '@/context/auth.context';
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
  const { needsOnboarding, needsFunctionalOnboarding, loading: configLoading } = useConfig();
  const { isLoading: authLoading, currentUser } = useAuth();
  const location = useLocation();
  
  // Permitir acceso a /config sin token para permitir registro del admin principal
  const isConfigPage = location.pathname === '/config';
  const isOnboardingTourPage = location.pathname === '/onboarding/tour';
  const isOnboardingPage = location.pathname === '/onboarding';
  
  // Determinar si necesita tour funcional
  const needsAnyTour = needsFunctionalOnboarding;
  
  // Si está cargando la autenticación o la configuración, mostrar spinner
  if (authLoading || configLoading) {
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

  // Permitir acceso a /config sin token para permitir registro
  if (isConfigPage && !hasToken() && !isVisitorMode) {
    return <>{children}</>;
  }

  // Permitir acceso si hay token o si está en modo visitante
  // Si hay token pero no hay usuario después de cargar, redirigir al login
  if (!hasToken() && !isVisitorMode) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero no se pudo obtener el usuario (token expirado), redirigir al login
  if (hasToken() && !currentUser && !isVisitorMode && !authLoading) {
    return <Navigate to="/login" replace />;
  }

  // Si está en modo visitante, permitir acceso
  if (isVisitorMode) {
    return <>{children}</>;
  }

  // Si necesita algún tour (fase 1 o fase 2) y está autenticado, redirigir al tour
  // Pero solo si no está ya en una página de onboarding
  if (needsAnyTour && hasToken() && currentUser && !isOnboardingTourPage && !isOnboardingPage) {
    return <Navigate to="/onboarding/tour" replace />;
  }

  // Si necesita onboarding de configuración y está autenticado, redirigir a onboarding
  // Pero solo si ya completó todos los tours
  if (needsOnboarding && hasToken() && currentUser && !needsAnyTour && !isOnboardingPage && !isOnboardingTourPage) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
