import { useState, useEffect } from 'react';
import { HiLockClosed } from 'react-icons/hi2';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { useUI } from '@/context/ui.context';
import { getAdminPermissions, updateAdminPermissions, updateAdminColorAccessibility } from '@/services/admin.service';
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
  [AdminPermission.GESTIONAR_CAJAFUERTE]: 'Gestionar caja (CajaFuerte)',
  [AdminPermission.GESTIONAR_CUPONES]: 'Gestionar cupones de descuento',
  [AdminPermission.GESTIONAR_ADMINS]: 'Gestionar administradores',
};

const PERMISSION_GROUPS: Array<{ title: string; items: string[] }> = [
  {
    title: 'Operaciones',
    items: [AdminPermission.DISPENSAR, AdminPermission.GESTIONAR_CUPONES],
  },
  {
    title: 'Gestión',
    items: [
      AdminPermission.GESTIONAR_PRODUCTOS,
      AdminPermission.GESTIONAR_STOCK,
      AdminPermission.GESTIONAR_CLIENTES,
    ],
  },
  {
    title: 'Caja y Reportes',
    items: [AdminPermission.GESTIONAR_CAJAFUERTE, AdminPermission.VER_REPORTES],
  },
  {
    title: 'Sistema',
    items: [AdminPermission.GESTIONAR_ADMINS],
  },
];

const ACCESSIBILITY_OPTIONS = [
  { value: 'normal', label: 'Normal', description: 'Colores estándar' },
  { value: 'protanopia', label: 'Protanopia (sin rojo)', description: 'Rojo reemplazado por azul' },
  { value: 'high-contrast', label: 'Alto contraste', description: 'Máximo contraste sin depender de colores' },
] as const;

export function AdminPermissionsEditor({ admin, onUpdate }: AdminPermissionsEditorProps) {
  const { showToast } = useUI();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colorAccessibility, setColorAccessibility] = useState<Admin['colorAccessibility']>(admin.colorAccessibility || 'normal');
  const [savingAccessibility, setSavingAccessibility] = useState(false);

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

  const handleSaveAccessibility = async () => {
    try {
      setSavingAccessibility(true);
      await updateAdminColorAccessibility(admin.id, colorAccessibility || 'normal');
      showToast('Configuración de accesibilidad actualizada', 'success');
      onUpdate?.();
    } catch (error: any) {
      showToast(error?.message || 'Error al actualizar accesibilidad', 'error');
    } finally {
      setSavingAccessibility(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-permissions-editor-loading">
        <Spinner size="md" />
      </div>
    );
  }

  const renderPermission = (permission: string) => {
    const label = PERMISSION_LABELS[permission] || permission;
    const isEnabled = permissions[permission] ?? false;
    const isDisabled =
      (permission === AdminPermission.DISPENSAR) ||
      (permission === AdminPermission.GESTIONAR_ADMINS && !isMainAdmin) ||
      isMainAdmin;

    return (
      <div key={permission} className="admin-permission-item">
        <div className="admin-permission-info">
          <span className="admin-permission-label-text">{label}</span>
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
          aria-label={`${label}: ${isEnabled ? 'activado' : 'desactivado'}`}
          aria-pressed={isEnabled}
          data-tour={`permission-toggle-${permission}`}
        >
          <span className="admin-permission-toggle-slider" />
        </button>
      </div>
    );
  };

  return (
    <div className="admin-permissions-editor">
      {isMainAdmin && (
        <div className="admin-permissions-warning">
          <span className="admin-permissions-warning-icon"><HiExclamationTriangle /></span>
          <span>El admin principal tiene todos los permisos y no pueden ser modificados.</span>
        </div>
      )}
      
      <div className="admin-permissions-list">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.title} className="admin-permissions-group">
            <div className="admin-permissions-group-title">{group.title}</div>
            <div className="admin-permissions-group-list">
              {group.items.map(renderPermission)}
            </div>
          </div>
        ))}
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

      {/* Sección de Accesibilidad de Color */}
      <div className="admin-accessibility-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Accesibilidad Visual
        </h4>
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Configura cómo se muestran los colores de estado para este administrador.
        </p>
        
        <div className="admin-accessibility-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {ACCESSIBILITY_OPTIONS.map((option) => (
            <label 
              key={option.value} 
              className="admin-accessibility-option"
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.75rem',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                backgroundColor: colorAccessibility === option.value ? 'var(--bg-tertiary)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="colorAccessibility"
                value={option.value}
                checked={colorAccessibility === option.value}
                onChange={(e) => setColorAccessibility(e.target.value as Admin['colorAccessibility'])}
                style={{ marginTop: '0.125rem' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{option.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <Button
          onClick={handleSaveAccessibility}
          disabled={savingAccessibility || colorAccessibility === admin.colorAccessibility}
          variant="secondary"
          size="small"
        >
          {savingAccessibility ? 'Guardando...' : 'Aplicar Configuración'}
        </Button>
      </div>
    </div>
  );
}
