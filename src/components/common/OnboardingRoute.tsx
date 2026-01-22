import { Navigate } from 'react-router-dom';
import { hasToken } from '@/services/auth.service';
import { useConfig } from '@/context/config.context';
import { Spinner } from '@/components/common/Spinner';

interface OnboardingRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege la ruta de onboarding.
 * Solo permite acceso si:
 * 1. El usuario está autenticado (tiene token)
 * 2. Necesita completar el onboarding (needsOnboarding = true)
 * 
 * Si no está autenticado, redirige a login.
 * Si ya completó el onboarding, redirige a home.
 */
export function OnboardingRoute({ children }: OnboardingRouteProps) {
  const { needsOnboarding, loading } = useConfig();

  // Si no hay token, redirigir a login
  if (!hasToken()) {
    return <Navigate to="/login" replace />;
  }

  // Mientras carga la configuración, mostrar spinner
  if (loading) {
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

  // Si no necesita onboarding, redirigir a home
  if (!needsOnboarding) {
    return <Navigate to="/home" replace />;
  }

  // Mostrar la página de onboarding
  return <>{children}</>;
}
