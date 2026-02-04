import { Navigate, useLocation } from 'react-router-dom';
import { hasToken } from '@/services/auth.service';
import { useConfig } from '@/context/config.context';
import { Spinner } from '@/components/common/Spinner';

interface OnboardingRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege la ruta de onboarding.
 * Maneja dos tipos de onboarding:
 * 1. Onboarding funcional (tour ventas) - /onboarding/tour
 * 2. Onboarding de configuración (nombre/logo) - /onboarding
 * 
 * Solo permite acceso si:
 * 1. El usuario está autenticado (tiene token)
 * 2. Necesita completar el tipo de onboarding correspondiente
 * 
 * Si no está autenticado, redirige a login.
 * Si ya completó todos los onboarding, redirige a home.
 */
export function OnboardingRoute({ children }: OnboardingRouteProps) {
  const { needsOnboarding, needsFunctionalOnboarding, loading } = useConfig();
  const location = useLocation();
  const isTourPage = location.pathname === '/onboarding/tour';
  const isConfigPage = location.pathname === '/onboarding';
  
  // Determinar si necesita tour funcional
  const needsAnyTour = needsFunctionalOnboarding;

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

  // Easter egg: permitir acceso forzado al tour si viene con parámetro ?force=true
  const searchParams = new URLSearchParams(location.search);
  const forceAccess = searchParams.get('force') === 'true';

  // Si está en la página del tour pero ya completó ambos tours, redirigir a configuración o home
  // (a menos que sea acceso forzado por easter egg)
  if (isTourPage && !needsAnyTour && !forceAccess) {
    if (needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  // Si está en la página de configuración pero necesita algún tour primero, redirigir al tour
  if (isConfigPage && needsAnyTour) {
    return <Navigate to="/onboarding/tour" replace />;
  }

  // Si está en la página de configuración pero ya completó todo, redirigir a home
  if (isConfigPage && !needsOnboarding) {
    return <Navigate to="/home" replace />;
  }

  // Mostrar la página de onboarding correspondiente
  return <>{children}</>;
}
