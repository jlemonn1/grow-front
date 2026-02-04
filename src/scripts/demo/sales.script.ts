import type { DemoScript } from '@/types/demo.types';

export const salesScript: DemoScript = {
  name: 'Listado de Ventas',
  description: 'Demostración del listado de ventas, filtros y navegación',
  steps: [
    { type: 'say', message: 'Veamos el listado de ventas' },
    { type: 'navigate', route: '/sales' },
    { type: 'waitFor', selector: '[data-tour=sales-list]', timeout: 5000 },
    { type: 'say', message: 'Aquí puedes ver todas las ventas realizadas' },
    { type: 'click', selector: '[data-tour=filter-customer]' },
    { type: 'waitFor', selector: '[data-tour=filter-customer] option:not([value=""])', timeout: 3000 },
    // Nota: Para seleccionar un cliente específico, necesitaríamos el ID del cliente
    // Como los IDs son UUIDs generados dinámicamente, aquí mostramos cómo se puede filtrar
    // En un escenario real, el DemoRunner podría obtener el primer cliente disponible dinámicamente
    { type: 'say', message: 'Puedes filtrar las ventas por cliente usando este selector' },
    { type: 'click', selector: '[data-tour=filter-date-start]' },
    { type: 'type', selector: '[data-tour=filter-date-start]', text: '2024-01-01' },
    { type: 'click', selector: '[data-tour=filter-date-end]' },
    { type: 'type', selector: '[data-tour=filter-date-end]', text: '2024-12-31' },
    { type: 'waitFor', selector: '[data-tour^=sale-row-]', timeout: 3000 },
    { type: 'say', message: 'También podemos filtrar por rango de fechas' },
    { type: 'click', selector: '[data-tour^=sale-row-]' },
    { type: 'waitFor', selector: '[data-tour=sale-detail]', timeout: 3000 },
    { type: 'say', message: 'Aquí puedes ver los detalles completos de la venta' },
    { type: 'click', selector: '[data-tour=back-to-sales]' },
    { type: 'waitFor', selector: '[data-tour=sales-list]', timeout: 2000 },
    { type: 'say', message: 'Volvemos al listado de ventas' },
  ],
};
