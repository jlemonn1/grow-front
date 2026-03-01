import { useLocation } from 'react-router-dom';
import { useState, useEffect, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { ToastHost } from '@/components/common/ToastHost';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { QuickSaleButton } from '@/components/sale/QuickSaleButton';
import { TickerCarousel } from '@/components/common/TickerCarousel';
import './AppLayout.css';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved !== 'false';
  });
  const location = useLocation();
  const isNewSalePage = location.pathname === '/sales/new';

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      localStorage.setItem('sidebarExpanded', String(!prev));
      return !prev;
    });
  };

  // Prevenir scroll del body cuando el menú está abierto en móvil
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-layout">
      <ConnectionStatus />
      <a href="#main-content" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
        Saltar al contenido principal
      </a>
      <SideNav 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu}
        onNavigate={closeMobileMenu}
        isExpanded={isSidebarExpanded}
        onToggleExpand={toggleSidebar}
      />
      {isMobileMenuOpen && (
        <div 
          className="app-layout-overlay" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <div className="app-layout-main">
        <TickerCarousel />
        <TopBar 
          onMenuToggle={openMobileMenu}
          isMenuOpen={isMobileMenuOpen}
        />
        <main id="main-content" className="app-layout-content" role="main" tabIndex={-1}>
          {children || <Outlet />}
        </main>
      </div>
      {!isNewSalePage && <QuickSaleButton />}
      <ToastHost />
    </div>
  );
}
