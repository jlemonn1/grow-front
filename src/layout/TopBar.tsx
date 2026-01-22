import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { useConfig } from '@/context/config.context';
import { useAuth } from '@/context/auth.context';
import { useUI } from '@/context/ui.context';
import { triggerPanicMode } from '@/services/panic.service';
import { buildResourceUrl } from '@/utils/apiUrl';
import './TopBar.css';

interface TopBarProps {
  title?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function TopBar({ title, onMenuToggle, isMenuOpen = false }: TopBarProps) {
  const { config } = useConfig();
  const { currentUser } = useAuth();
  const { showToast } = useUI();
  const [isPanicModeReady, setIsPanicModeReady] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUsernameClick = () => {
    // Limpiar timeout anterior si existe
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Incrementar contador
    clickCountRef.current += 1;

    // Si llegamos a 3 clics, activar modo pánico preparado
    if (clickCountRef.current >= 3) {
      setIsPanicModeReady(true);
      clickCountRef.current = 0;
    } else {
      // Resetear contador después de 1 segundo sin clics
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000);
    }
  };

  const handleLogoClick = async (e: React.MouseEvent) => {
    // Si el modo pánico está activado, ejecutar limpieza
    if (isPanicModeReady) {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        showToast('Ejecutando modo pánico...', 'info');
        const response = await triggerPanicMode();
        
        if (response.success) {
          showToast('Modo pánico ejecutado. Backup creado en: ' + response.backupPath, 'success');
          setIsPanicModeReady(false);
          // Recargar la página para reflejar los cambios
          window.location.reload();
        } else {
          showToast('Error al ejecutar modo pánico: ' + response.message, 'error');
          setIsPanicModeReady(false);
        }
      } catch (error: any) {
        // No mostrar toast si el error es 403 (Forbidden)
        if (error?.status !== 403) {
          showToast('Error al ejecutar modo pánico', 'error');
        }
        setIsPanicModeReady(false);
      }
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar-content">
        <div className="top-bar-left">
          <button
            type="button"
            className="top-bar-menu-button"
            onClick={onMenuToggle}
            aria-label="Abrir menú de navegación"
            aria-expanded={isMenuOpen}
            aria-controls="side-nav"
          >
            <span className="top-bar-menu-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <Link 
            to="/home" 
            className="top-bar-logo" 
            aria-label="Ir a inicio"
            onClick={handleLogoClick}
            style={isPanicModeReady ? { cursor: 'pointer' } : {}}
          >
            {config?.logoUrl ? (
              <img 
                src={buildResourceUrl(config.logoUrl)} 
                alt={config.growName || 'Logo'} 
                className="top-bar-logo-img" 
              />
            ) : (
              <span className="top-bar-logo-icon"><HiSparkles /></span>
            )}
            <span className="top-bar-logo-text">{config?.growName || 'Growshop'}</span>
          </Link>
        </div>
        {title && <h2 className="top-bar-title">{title}</h2>}
        <div className="top-bar-actions">
          {currentUser && (
            <span 
              className="top-bar-username" 
              onClick={handleUsernameClick}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {currentUser.username}
              {currentUser.isMainAdmin && (
                <span className="top-bar-admin-badge" title="Administrador principal">
                  <HiSparkles />
                </span>
              )}
              {isPanicModeReady && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#ff0000',
                    borderRadius: '50%',
                    opacity: 0.8,
                    boxShadow: '0 0 4px rgba(255, 0, 0, 0.6)',
                  }}
                  title="Modo pánico activado - Clic en logo para ejecutar"
                />
              )}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
