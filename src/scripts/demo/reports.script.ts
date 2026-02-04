import type { DemoScript } from '@/types/demo.types';

export const reportsScript: DemoScript = {
  name: 'Reportes y Estadísticas',
  description: 'Demostración del dashboard, gráficas y generación de PDF',
  steps: [
    { type: 'say', message: 'Veamos los reportes y estadísticas' },
    { type: 'navigate', route: '/reports' },
    { type: 'waitFor', selector: '[data-tour=reports-dashboard]', timeout: 5000 },
    { type: 'say', message: 'Dashboard mensual con top productos y clientes' },
    { type: 'waitFor', selector: '[data-tour=month-selector-month]', timeout: 3000 },
    { type: 'select', selector: '[data-tour=month-selector-month]', value: '11' },
    { type: 'waitFor', selector: '[data-tour=top-products]', timeout: 3000 },
    { type: 'say', message: 'Aquí puedes ver los productos más populares y rentables' },
    { type: 'waitFor', selector: '[data-tour=top-customers]', timeout: 3000 },
    { type: 'say', message: 'Y los top 3 compradores del mes' },
    { type: 'waitFor', selector: '[data-tour=hourly-stats]', timeout: 3000 },
    { type: 'say', message: 'Estadísticas detalladas por hora del día' },
    { type: 'waitFor', selector: '[data-tour=generate-pdf]', timeout: 3000 },
    { type: 'click', selector: '[data-tour=generate-pdf]' },
    { type: 'waitFor', selector: '.toast', timeout: 5000 },
    { type: 'say', message: 'PDF generado (en demo no se descarga realmente)' },
  ],
};
