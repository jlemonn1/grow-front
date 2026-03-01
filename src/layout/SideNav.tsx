import { NavLink, useNavigate, Link } from 'react-router-dom';
import { HiHome, HiCurrencyEuro, HiDocumentText, HiCube, HiUser, HiChartBar, HiCog, HiUsers, HiLockClosed, HiTicket } from 'react-icons/hi';
import { HiArrowRightOnRectangle, HiSparkles, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { useUI } from '@/context/ui.context';
import { useConfig } from '@/context/config.context';
import { useAuth } from '@/context/auth.context';
import { AdminPermission } from '@/types/models';
import { buildResourceUrl } from '@/utils/apiUrl';
import { useEffect, useState, useMemo } from 'react';
import './SideNav.css';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SideNav({ isOpen = false, onClose, onNavigate, isExpanded = true, onToggleExpand }: SideNavProps) {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { config } = useConfig();
  const { currentUser, logout, hasPermission } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth <= 640;
      // Solo actualizar si el valor realmente cambió
      setIsMobile(prev => {
        if (prev !== newIsMobile) {
          return newIsMobile;
        }
        return prev;
      });
    };
    
    // Establecer valor inicial
    setIsMobile(window.innerWidth <= 640);
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Crear array de items de navegación según permisos
  const navItems = useMemo(() => {
    const items: Array<{ path: string; label: string; icon: React.ReactNode; requiresPermission?: string }> = [
      { path: '/home', label: 'Inicio', icon: <HiHome /> },
    ];

    // Caja - requiere DISPENSAR
    if (hasPermission(AdminPermission.DISPENSAR)) {
      items.push({ path: '/sales/new', label: 'Dispensar', icon: <HiCurrencyEuro /> });
      items.push({ path: '/sales', label: 'Dispensaciones', icon: <HiDocumentText /> });
    }

    // Productos - siempre visible, pero solo crear/editar requiere permiso
    items.push({ path: '/products', label: 'Productos', icon: <HiCube /> });

    // Clientes - siempre visible, pero solo crear/editar requiere permiso
    items.push({ path: '/customers', label: 'Socios', icon: <HiUser /> });

    // Reportes - requiere VER_REPORTES
    if (hasPermission(AdminPermission.VER_REPORTES)) {
      items.push({ path: '/reports', label: 'Reportes', icon: <HiChartBar /> });
    }

    // CajaFuerte - requiere GESTIONAR_CAJAFUERTE
    if (hasPermission(AdminPermission.GESTIONAR_CAJAFUERTE)) {
      items.push({ path: '/cajafuerte', label: 'CajaFuerte', icon: <HiLockClosed /> });
    }

    // Cupones - requiere GESTIONAR_CUPONES
    if (hasPermission(AdminPermission.GESTIONAR_CUPONES)) {
      items.push({ path: '/coupons', label: 'Cupones', icon: <HiTicket /> });
    }

    // Configuración - siempre visible
    items.push({ path: '/config', label: 'Configuración', icon: <HiCog /> });

    // Administradores - solo si es admin principal
    if (currentUser?.isMainAdmin) {
      items.push({ path: '/admins', label: 'Administradores', icon: <HiUsers /> });
    }

    return items;
  }, [currentUser?.isMainAdmin, hasPermission]);

  const handleLogout = () => {
    logout();
    showToast('Sesión cerrada correctamente', 'success');
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    // Cerrar el menú en móvil cuando se hace click en un enlace
    if (isMobile && onNavigate) {
      // Pequeño delay para permitir que la navegación se complete
      setTimeout(() => {
        onNavigate();
      }, 100);
    }
  };

  return (
    <nav 
      className={`side-nav ${isOpen ? 'open' : ''} ${!isMobile && !isExpanded ? 'collapsed' : ''}`}
      id="side-nav"
      aria-label="Navegación principal"
      aria-hidden={isMobile ? !isOpen : false}
    >
      <div className="side-nav-header">
        {isMobile && isOpen && (
          <button
            type="button"
            className="side-nav-close-button"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
        <Link 
          to="/home" 
          className={`side-nav-logo ${!isMobile && !isExpanded ? 'side-nav-logo-collapsed' : ''}`}
          onClick={handleNavClick}
          aria-label="Ir a inicio"
        >
          {config?.logoUrl ? (
            <img 
              src={buildResourceUrl(config.logoUrl)} 
              alt={config.growName || 'Logo'} 
              className="side-nav-logo-img" 
            />
          ) : (
            <span className="side-nav-logo-icon"><HiSparkles /></span>
          )}
          {isMobile || isExpanded ? <span className="side-nav-logo-text">{config?.growName || 'Growshop'}</span> : null}
        </Link>
        {!isMobile && onToggleExpand && (
          <button
            type="button"
            className={`side-nav-toggle ${!isExpanded ? 'side-nav-toggle-collapsed' : ''}`}
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Colapsar menú' : 'Expandir menú'}
            title={isExpanded ? 'Colapsar menú' : 'Expandir menú'}
          >
            <span aria-hidden="true">{isExpanded ? <HiChevronLeft /> : <HiChevronRight />}</span>
          </button>
        )}
      </div>
      <ul className="side-nav-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `side-nav-link ${isActive ? 'side-nav-link-active' : ''}`
              }
              onClick={handleNavClick}
            >
              <span className="side-nav-icon" aria-hidden="true">{item.icon}</span>
              {isMobile || isExpanded ? <span className="side-nav-label">{item.label}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="side-nav-footer">
        <button
          type="button"
          onClick={handleLogout}
          className="side-nav-logout"
          aria-label="Cerrar sesión"
        >
          <span className="side-nav-icon" aria-hidden="true"><HiArrowRightOnRectangle /></span>
          {isMobile || isExpanded ? <span className="side-nav-label">Cerrar sesión</span> : null}
        </button>
      </div>
    </nav>
  );
}
