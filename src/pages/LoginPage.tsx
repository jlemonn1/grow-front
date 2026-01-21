import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, hasToken } from '@/services/auth.service';
import { useUI } from '@/context/ui.context';
import { useAuth } from '@/context/auth.context';
import { RegisterMainAdminModal } from '@/components/auth/RegisterMainAdminModal';
import './LoginPage.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { refreshUser } = useAuth();

  // Si ya está autenticado, redirigir
  if (hasToken()) {
    navigate('/home', { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
      await refreshUser();
      showToast('Sesión iniciada correctamente', 'success');
      navigate('/home', { replace: true });
    } catch (err: any) {
      // Verificar si se requiere registro
      if (err?.requiresRegistration || err?.status === 428) {
        setShowRegisterModal(true);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSuccess = async () => {
    await refreshUser();
    setShowRegisterModal(false);
    navigate('/home', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
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

        <RegisterMainAdminModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleRegisterSuccess}
        />
      </div>
    </div>
  );
}
