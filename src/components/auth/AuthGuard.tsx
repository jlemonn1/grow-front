import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { hasToken } from '@/services/auth.service';

/**
 * Componente que maneja la redirección automática al login
 * cuando se detecta desautenticación o token expirado
 */
export function AuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    // Escuchar cuando se completa el logout por desautenticación
    const handleLogoutComplete = () => {
      // Redirigir al login si no estamos ya ahí o en /config (donde se puede registrar)
      if (location.pathname !== '/login' && location.pathname !== '/config') {
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('auth:logout-complete', handleLogoutComplete);
    
    return () => {
      window.removeEventListener('auth:logout-complete', handleLogoutComplete);
    };
  }, [navigate, location.pathname]);

  // Si terminó de cargar y no hay usuario ni token, redirigir al login
  // Excepto si estamos en /config (donde se puede registrar el admin principal)
  useEffect(() => {
    if (!isLoading && !currentUser && !hasToken() && location.pathname !== '/login' && location.pathname !== '/config') {
      navigate('/login', { replace: true });
    }
  }, [isLoading, currentUser, navigate, location.pathname]);

  return null;
}
