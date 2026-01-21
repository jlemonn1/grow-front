import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { ToastHost } from '@/components/common/ToastHost';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { QuickSaleButton } from '@/components/sale/QuickSaleButton';
import './AppLayout.css';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
      />
      {isMobileMenuOpen && (
        <div 
          className="app-layout-overlay" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
      <div className="app-layout-main">
        <TopBar 
          onMenuToggle={openMobileMenu}
          isMenuOpen={isMobileMenuOpen}
        />
        <main id="main-content" className="app-layout-content" role="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <QuickSaleButton />
      <ToastHost />
    </div>
  );
}
