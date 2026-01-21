import { useReports as useReportsContext } from '@/context/reports.context';

/**
 * Hook para acceder al contexto de reportes
 * Re-exporta useReports del contexto para mantener consistencia con otros hooks
 */
export function useReports() {
  return useReportsContext();
}
