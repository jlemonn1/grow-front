import { useState, FormEvent, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login, hasToken } from '@/services/auth.service';
import { useUI } from '@/context/ui.context';
import { useAuth } from '@/context/auth.context';
import { useVisitor } from '@/context/visitor.context';
import { useConfig } from '@/context/config.context';
import { Spinner } from '@/components/common/Spinner';
import './LoginPage.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { refreshUser, currentUser, isLoading: authLoading } = useAuth();
  const { refreshConfiguration, needsFunctionalOnboarding, needsOnboarding } = useConfig();
  const { activateVisitorMode, deactivateVisitorMode } = useVisitor();
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mostrar spinner mientras carga la autenticación
  if (authLoading) {
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

  // Si ya está autenticado y hay un usuario válido, redirigir según necesidades de onboarding
  // Esperamos a que termine de cargar la autenticación para evitar ciclos infinitos
  if (hasToken() && currentUser) {
    // Verificar necesidades de onboarding y redirigir apropiadamente
    if (needsFunctionalOnboarding) {
      return <Navigate to="/onboarding/tour" replace />;
    } else if (needsOnboarding) {
      return <Navigate to="/onboarding" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(username, password);
      
      // Verificar si se ejecutó el modo pánico
      if (response.panicModeExecuted) {
        showToast('Modo pánico ejecutado. La base de datos ha sido limpiada.', 'warning');
        // Recargar la página después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }
      
      // Desactivar modo visitante al iniciar sesión exitosamente
      deactivateVisitorMode();
      await refreshUser();
      // Recargar configuración después del login para verificar si necesita onboarding
      await refreshConfiguration();
      showToast('Sesión iniciada correctamente', 'success');
      
      // Verificar si necesita onboarding funcional primero
      // Esperar un momento para que el contexto se actualice después de refreshConfiguration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar necesidades de onboarding y redirigir apropiadamente
      if (needsFunctionalOnboarding) {
        navigate('/onboarding/tour', { replace: true });
      } else if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (err: any) {
      // Verificar si se requiere registro
      if (err?.requiresRegistration || err?.status === 428) {
        // Redirigir a /config en lugar de mostrar modal
        navigate('/config', { replace: true });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleLoginHeaderClick = () => {
    // Limpiar timeout anterior si existe
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Incrementar contador
    clickCountRef.current += 1;

    // Si llegamos a 3 clics, activar modo visitante
    if (clickCountRef.current >= 3) {
      activateVisitorMode();
      navigate('/home', { replace: true });
      clickCountRef.current = 0;
    } else {
      // Resetear contador después de 1 segundo sin clics
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header" onClick={handleLoginHeaderClick} style={{ cursor: 'pointer' }}>
          <h1>Growshop</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && username && password) {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

      </div>
    </div>
  );
}
