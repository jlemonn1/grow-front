import { useState, FormEvent } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/forms/Input';
import { registerMainAdmin } from '@/services/auth.service';
import { useUI } from '@/context/ui.context';
import './RegisterMainAdminModal.css';

interface RegisterMainAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterMainAdminModal({ isOpen, onClose, onSuccess }: RegisterMainAdminModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUI();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!username || username.length < 3) {
      setError('El username debe tener al menos 3 caracteres');
      return;
    }

    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      await registerMainAdmin(username, password);
      showToast('Admin principal registrado exitosamente', 'success');
      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al registrar el admin principal';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Admin Principal">
      <div className="register-main-admin-modal">
        <p className="register-main-admin-info">
          Este es el primer inicio de sesión. Por favor, crea el administrador principal del sistema.
        </p>

        <form onSubmit={handleSubmit} className="register-main-admin-form">
          {error && (
            <div className="register-main-admin-error">
              {error}
            </div>
          )}

          <Input
            label="Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa un usuario"
            required
            autoFocus
            disabled={isLoading}
            minLength={3}
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa una contraseña"
            required
            disabled={isLoading}
            minLength={6}
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirma la contraseña"
            required
            disabled={isLoading}
            minLength={6}
          />

          <div className="register-main-admin-actions">
            <button
              type="submit"
              className="register-main-admin-button"
              disabled={isLoading || !username || !password || !confirmPassword}
            >
              {isLoading ? 'Registrando...' : 'Registrar Admin Principal'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}