import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { Input } from '@/components/forms/Input';
import { FormCard } from '@/components/forms/FormCard';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { useUI } from '@/context/ui.context';
import { useAuth } from '@/context/auth.context';
import { getAllAdmins, createAdmin, deleteAdmin } from '@/services/admin.service';
import type { Admin } from '@/types/models';
import { formatDateTime } from '@/utils/dates';
import './AdminsPage.css';

export function AdminsPage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { currentUser, refreshUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; admin: Admin | null }>({
    isOpen: false,
    admin: null,
  });

  // Verificar que el usuario sea admin principal
  useEffect(() => {
    if (currentUser && !currentUser.isMainAdmin) {
      showToast('No tienes permisos para acceder a esta página', 'error');
      navigate('/home', { replace: true });
    }
  }, [currentUser, navigate, showToast]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (error) {
      showToast('Error al cargar administradores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar admins
  useEffect(() => {
    if (currentUser?.isMainAdmin) {
      loadAdmins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await createAdmin(newUsername, newPassword);
      showToast('Admin creado exitosamente', 'success');
      setNewUsername('');
      setNewPassword('');
      setShowCreateForm(false);
      await loadAdmins();
      await refreshUser();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear admin';
      showToast(errorMessage, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (admin: Admin) => {
    setDeleteModal({ isOpen: true, admin });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.admin) return;

    try {
      await deleteAdmin(deleteModal.admin.id);
      showToast('Admin desactivado exitosamente', 'success');
      setDeleteModal({ isOpen: false, admin: null });
      await loadAdmins();
      await refreshUser();
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al desactivar admin';
      showToast(errorMessage, 'error');
    }
  };

  if (!currentUser?.isMainAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="admins-page">
        <PageHeader title="Administradores" />
        <div className="admins-loading">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="admins-page">
      <PageHeader 
        title="Administradores"
        action={{
          label: showCreateForm ? 'Cancelar' : 'Nuevo Admin',
          onClick: () => setShowCreateForm(!showCreateForm),
        }}
      />

      {showCreateForm && (
        <FormCard title="Crear Nuevo Administrador">
          <form onSubmit={handleCreateAdmin} className="admins-create-form">
            <Input
              label="Usuario"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Ingresa un usuario"
              required
              minLength={3}
              disabled={isCreating}
            />
            <Input
              label="Contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingresa una contraseña"
              required
              minLength={6}
              disabled={isCreating}
            />
            <div className="admins-form-actions">
              <Button type="submit" disabled={isCreating || !newUsername || !newPassword}>
                {isCreating ? 'Creando...' : 'Crear Admin'}
              </Button>
            </div>
          </form>
        </FormCard>
      )}

      <div className="admins-list">
        {admins.map((admin) => (
          <div key={admin.id} className="admin-card">
            <div className="admin-info">
              <div className="admin-username">
                {admin.username}
                {admin.isMainAdmin && <span className="admin-badge">👑 Principal</span>}
                {!admin.isActive && <span className="admin-badge-inactive">Inactivo</span>}
              </div>
              {admin.createdAt && (
                <div className="admin-meta">
                  Creado: {formatDateTime(admin.createdAt)}
                </div>
              )}
            </div>
            <div className="admin-actions">
              {!admin.isMainAdmin && admin.isActive && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteClick(admin)}
                >
                  Desactivar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, admin: null })}
        onConfirm={handleConfirmDelete}
        title="Desactivar Administrador"
        message="¿Estás seguro de que deseas desactivar este administrador?"
        itemName={deleteModal.admin?.username}
      />
    </div>
  );
}