import { useState, useEffect } from 'react';
import { HiLockClosed } from 'react-icons/hi';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { useUI } from '@/context/ui.context';
import { getAdminPermissions, updateAdminPermissions } from '@/services/admin.service';
import { AdminPermission, type Admin } from '@/types/models';
import './AdminPermissionsEditor.css';

interface AdminPermissionsEditorProps {
  admin: Admin;
  onUpdate?: () => void;
}

const PERMISSION_LABELS: Record<string, string> = {
  [AdminPermission.DISPENSAR]: 'Realizar ventas y dispensaciones',
  [AdminPermission.GESTIONAR_PRODUCTOS]: 'Crear y editar productos',
  [AdminPermission.GESTIONAR_STOCK]: 'Añadir stock y recargar inventario',
  [AdminPermission.GESTIONAR_CLIENTES]: 'Crear y editar socios',
  [AdminPermission.VER_REPORTES]: 'Ver reportes, resúmenes y balances',
  [AdminPermission.GESTIONAR_ADMINS]: 'Gestionar administradores',
};

export function AdminPermissionsEditor({ admin, onUpdate }: AdminPermissionsEditorProps) {
  const { showToast } = useUI();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // El admin principal no puede editar sus permisos
  const isMainAdmin = admin.isMainAdmin;

  useEffect(() => {
    if (isMainAdmin) {
      // Para el admin principal, mostrar todos los permisos como activos
      const allPermissions: Record<string, boolean> = {};
      Object.values(AdminPermission).forEach((perm) => {
        allPermissions[perm] = true;
      });
      setPermissions(allPermissions);
      setLoading(false);
    } else {
      // Cargar permisos desde el servidor
      loadPermissions();
    }
  }, [admin.id, isMainAdmin]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const perms = await getAdminPermissions(admin.id);
      setPermissions(perms);
    } catch (error: any) {
      showToast(error?.message || 'Error al cargar permisos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, enabled: boolean) => {
    // DISPENSAR siempre debe estar habilitado
    if (permission === AdminPermission.DISPENSAR && !enabled) {
      showToast('El permiso de dispensar no se puede desactivar', 'error');
      return;
    }

    // GESTIONAR_ADMINS solo puede estar para el admin principal
    if (permission === AdminPermission.GESTIONAR_ADMINS && enabled && !isMainAdmin) {
      showToast('Solo el admin principal puede tener este permiso', 'error');
      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [permission]: enabled,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Asegurar que DISPENSAR esté siempre activado
      const permissionsToSave = {
        ...permissions,
        [AdminPermission.DISPENSAR]: true,
        // GESTIONAR_ADMINS solo si es main admin, sino siempre false
        [AdminPermission.GESTIONAR_ADMINS]: isMainAdmin ? permissions[AdminPermission.GESTIONAR_ADMINS] : false,
      };

      await updateAdminPermissions(admin.id, permissionsToSave);
      showToast('Permisos actualizados exitosamente', 'success');
      onUpdate?.();
    } catch (error: any) {
      showToast(error?.message || 'Error al actualizar permisos', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-permissions-editor-loading">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="admin-permissions-editor">
      {isMainAdmin && (
        <div className="admin-permissions-warning">
          <span className="admin-permissions-warning-icon"><HiExclamationTriangle /></span>
          <span>El admin principal tiene todos los permisos y no pueden ser modificados.</span>
        </div>
      )}
      
      <div className="admin-permissions-list">
        {Object.values(AdminPermission).map((permission) => {
          const isEnabled = permissions[permission] ?? false;
          const isDisabled = 
            (permission === AdminPermission.DISPENSAR) ||
            (permission === AdminPermission.GESTIONAR_ADMINS && !isMainAdmin) ||
            isMainAdmin;

          return (
            <div key={permission} className="admin-permission-item">
              <div className="admin-permission-info">
                <span className="admin-permission-label-text">
                  {PERMISSION_LABELS[permission]}
                </span>
                {isDisabled && (
                  <span className="admin-permission-badge-locked">
                    <HiLockClosed className="admin-permission-badge-locked-icon" />
                    Bloqueado
                  </span>
                )}
              </div>
              <button
                type="button"
                className={`admin-permission-toggle ${isEnabled ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && handlePermissionChange(permission, !isEnabled)}
                disabled={isDisabled}
                aria-label={`${PERMISSION_LABELS[permission]}: ${isEnabled ? 'activado' : 'desactivado'}`}
                aria-pressed={isEnabled}
                data-tour={`permission-toggle-${permission}`}
              >
                <span className="admin-permission-toggle-slider" />
              </button>
            </div>
          );
        })}
      </div>

      {!isMainAdmin && (
        <div className="admin-permissions-actions">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            data-tour="save-permissions"
          >
            {saving ? 'Guardando...' : 'Guardar Permisos'}
          </Button>
        </div>
      )}
    </div>
  );
}
