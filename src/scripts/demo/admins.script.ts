import type { DemoScript } from '@/types/demo.types';
import { AdminPermission } from '@/types/models';

export const adminsScript: DemoScript = {
  name: 'Gestión de Administradores',
  description: 'Demostración del listado, creación y gestión de permisos de administradores',
  steps: [
    { type: 'say', message: 'Gestionemos administradores', duration: 2000 },
    { type: 'navigate', route: '/admins' },
    { type: 'waitFor', selector: '[data-tour="admins-list"]', timeout: 5000 },
    { type: 'say', message: 'Aquí puedes ver todos los administradores del sistema', duration: 2000 },
    { type: 'click', selector: '[data-tour="create-admin-button"]', timeout: 5000 },
    { type: 'waitFor', selector: '[data-tour="admin-username-input"]', timeout: 5000 },
    { type: 'click', selector: '[data-tour="admin-username-input"]', timeout: 5000 },
    { type: 'type', selector: '[data-tour="admin-username-input"]', text: 'demo_admin', timeout: 5000 },
    { type: 'click', selector: '[data-tour="admin-password-input"]', timeout: 5000 },
    { type: 'type', selector: '[data-tour="admin-password-input"]', text: 'demo123456', timeout: 5000 },
    { type: 'say', message: 'En modo demo, este admin no se creará realmente', duration: 2000 },
    { type: 'click', selector: '[data-tour="save-admin"]', timeout: 5000 },
    { type: 'waitFor', selector: '[data-tour^="admin-row-"]', timeout: 5000 },
    { type: 'waitFor', selector: '[data-tour^="permissions-button-"]', timeout: 5000 },
    { type: 'say', message: 'Ahora vamos a gestionar los permisos de un administrador', duration: 2000 },
    { type: 'click', selector: '[data-tour^="permissions-button-"]', timeout: 5000 },
    { type: 'waitFor', selector: `[data-tour="permission-toggle-${AdminPermission.GESTIONAR_PRODUCTOS}"]`, timeout: 5000 },
    { type: 'say', message: 'Puedes activar o desactivar permisos específicos para cada admin', duration: 2000 },
    { type: 'click', selector: `[data-tour="permission-toggle-${AdminPermission.GESTIONAR_PRODUCTOS}"]`, timeout: 5000 },
    { type: 'waitFor', selector: `[data-tour="permission-toggle-${AdminPermission.VER_REPORTES}"]`, timeout: 5000 },
    { type: 'click', selector: `[data-tour="permission-toggle-${AdminPermission.VER_REPORTES}"]`, timeout: 5000 },
    { type: 'say', message: 'Los cambios se guardan al hacer click en Guardar Permisos', duration: 2000 },
    { type: 'waitFor', selector: '[data-tour="save-permissions"]', timeout: 5000 },
    { type: 'click', selector: '[data-tour="save-permissions"]', timeout: 5000 },
    { type: 'say', message: 'Permisos actualizados correctamente. En modo demo, los cambios no se guardan realmente', duration: 2000 },
  ],
};
