import { Link } from 'react-router-dom';
import { useConfig } from '@/context/config.context';
import { useAuth } from '@/context/auth.context';
import './TopBar.css';

interface TopBarProps {
  title?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function TopBar({ title, onMenuToggle, isMenuOpen = false }: TopBarProps) {
  const { config } = useConfig();
  const { currentUser } = useAuth();

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
          <Link to="/home" className="top-bar-logo" aria-label="Ir a inicio">
            {config?.logoUrl ? (
              <img 
                src={config.logoUrl.startsWith('http') ? config.logoUrl : `http://localhost:8080${config.logoUrl}`} 
                alt={config.growName || 'Logo'} 
                className="top-bar-logo-img" 
              />
            ) : (
              <span className="top-bar-logo-emoji">🌱</span>
            )}
            <span className="top-bar-logo-text">{config?.growName || 'Growshop'}</span>
          </Link>
        </div>
        {title && <h2 className="top-bar-title">{title}</h2>}
        <div className="top-bar-actions">
          {currentUser && (
            <span className="top-bar-username">
              {currentUser.username}
              {currentUser.isMainAdmin && (
                <span className="top-bar-admin-badge" title="Administrador principal">
                  👑
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
