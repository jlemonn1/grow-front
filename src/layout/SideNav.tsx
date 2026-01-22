import { NavLink, useNavigate, Link } from 'react-router-dom';
import { HiHome, HiCurrencyEuro, HiDocumentText, HiCube, HiUser, HiChartBar, HiCog, HiUsers } from 'react-icons/hi';
import { HiArrowRightOnRectangle, HiSparkles } from 'react-icons/hi2';
import { useUI } from '@/context/ui.context';
import { useConfig } from '@/context/config.context';
import { useAuth } from '@/context/auth.context';
import { AdminPermission } from '@/types/models';
import { buildResourceUrl } from '@/utils/apiUrl';
import { useEffect, useState, useMemo, useRef } from 'react';
import { triggerCompleteReset } from '@/services/panic.service';
import './SideNav.css';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

export function SideNav({ isOpen = false, onClose, onNavigate }: SideNavProps) {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { config } = useConfig();
  const { currentUser, logout, hasPermission } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Estados para el easter egg de reset completo
  const [configClickCount, setConfigClickCount] = useState(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
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
      items.push({ path: '/sales/new', label: 'Caja', icon: <HiCurrencyEuro /> });
      items.push({ path: '/sales', label: 'Ventas', icon: <HiDocumentText /> });
    }

    // Productos - siempre visible, pero solo crear/editar requiere permiso
    items.push({ path: '/products', label: 'Productos', icon: <HiCube /> });

    // Clientes - siempre visible, pero solo crear/editar requiere permiso
    items.push({ path: '/customers', label: 'Clientes', icon: <HiUser /> });

    // Reportes - requiere VER_REPORTES
    if (hasPermission(AdminPermission.VER_REPORTES)) {
      items.push({ path: '/reports', label: 'Reportes', icon: <HiChartBar /> });
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

  // Manejar clics en el botón de configuración para el easter egg
  const handleConfigClick = (_e: React.MouseEvent) => {
    // Solo activar el easter egg si el usuario está autenticado
    if (!currentUser) {
      return;
    }

    // Limpiar timeout anterior si existe
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = configClickCount + 1;
    setConfigClickCount(newCount);

    // Si llegamos a 3 clics, mostrar confirmación
    if (newCount === 3) {
      const confirmed = window.confirm(
        '⚠️ RESET COMPLETO ⚠️\n\n' +
        'Estás a punto de ejecutar un reset completo de la base de datos.\n\n' +
        'Esto borrará ABSOLUTAMENTE TODO incluyendo:\n' +
        '- Todas las ventas\n' +
        '- Todos los productos\n' +
        '- Todos los clientes\n' +
        '- Todos los administradores\n' +
        '- Toda la configuración\n\n' +
        'Esta operación es IRREVERSIBLE.\n\n' +
        '¿Estás seguro de que quieres continuar?'
      );

      if (confirmed) {
        executeCompleteReset();
      } else {
        // Resetear contador si cancela
        setConfigClickCount(0);
      }
    } else {
      // Resetear contador después de 2 segundos sin actividad
      clickTimeoutRef.current = setTimeout(() => {
        setConfigClickCount(0);
      }, 2000);
    }
  };

  // Ejecutar el reset completo
  const executeCompleteReset = async () => {
    if (isResetting) return;

    setIsResetting(true);
    setConfigClickCount(0);

    try {
      showToast('Ejecutando reset completo...', 'info');
      await triggerCompleteReset();
      
      showToast('Reset completo ejecutado exitosamente', 'success');
      
      // Esperar un momento antes de hacer logout
      setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error('Error al ejecutar reset completo:', error);
      const errorMessage = error?.message || 'Error al ejecutar reset completo';
      showToast(errorMessage, 'error');
      setIsResetting(false);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav 
      className={`side-nav ${isOpen ? 'open' : ''}`}
      id="side-nav"
      aria-label="Navegación principal"
      aria-hidden={isMobile ? !isOpen : false}
    >
      <div className="side-nav-header">
        <button
          type="button"
          className="side-nav-close-button"
          onClick={onClose}
          aria-label="Cerrar menú de navegación"
        >
          <span aria-hidden="true">×</span>
        </button>
        <Link 
          to="/home" 
          className="side-nav-logo"
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
          <span className="side-nav-logo-text">{config?.growName || 'Growshop'}</span>
        </Link>
      </div>
      <ul className="side-nav-list">
        {navItems.map((item) => {
          // Manejar clics especiales para el botón de configuración
          const handleClick = item.path === '/config' 
            ? (e: React.MouseEvent) => {
                handleConfigClick(e);
                handleNavClick();
              }
            : handleNavClick;

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `side-nav-link ${isActive ? 'side-nav-link-active' : ''}`
                }
                onClick={handleClick}
              >
                <span className="side-nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="side-nav-label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div className="side-nav-footer">
        <button
          type="button"
          onClick={handleLogout}
          className="side-nav-logout"
          aria-label="Cerrar sesión"
        >
          <span className="side-nav-icon" aria-hidden="true"><HiArrowRightOnRectangle /></span>
          <span className="side-nav-label">Cerrar sesión</span>
        </button>
      </div>
    </nav>
  );
}
