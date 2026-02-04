import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonthlyDashboard } from '@/components/report/MonthlyDashboard';
import { useAuth } from '@/context/auth.context';
import { useUI } from '@/context/ui.context';
import { AdminPermission } from '@/types/models';
import './ReportsPage.css';

export function ReportsPage() {
  const navigate = useNavigate();
  const { hasPermission, isLoading } = useAuth();
  const { showToast } = useUI();

  // Memoizar la verificación de permisos para evitar recreaciones innecesarias
  const canViewReports = useMemo(() => {
    return hasPermission(AdminPermission.VER_REPORTES);
  }, [hasPermission]);

  useEffect(() => {
    // Solo verificar permisos después de que termine la carga
    if (isLoading) {
      return;
    }

    if (!canViewReports) {
      showToast('No tienes permiso para ver reportes', 'error');
      navigate('/home', { replace: true });
    }
  }, [isLoading, canViewReports, navigate, showToast]);

  // Mostrar loading mientras se carga la autenticación
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Si no tiene permisos, no renderizar nada (el useEffect ya redirigirá)
  if (!canViewReports) {
    return null;
  }

  return (
    <div data-tour="reports-dashboard">
      <MonthlyDashboard />
    </div>
  );
}
