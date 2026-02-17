import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineTicket, HiPencil, HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { CardList } from '@/components/common/CardList';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/forms/Input';
import { NumberInput } from '@/components/forms/NumberInput';
import { Select } from '@/components/forms/Select';
import { FormCard } from '@/components/forms/FormCard';
import { useUI } from '@/context/ui.context';
import { useAuth } from '@/context/auth.context';
import { couponsService } from '@/services/coupons.service';
import { AdminPermission } from '@/types/models';
import type { ColumnDef } from '@/components/common/DataTable';
import type { Coupon, CouponDiscountType, CreateCouponRequest, UpdateCouponRequest } from '@/types/models';
import './CouponsPage.css';

type FilterMode = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';

function normalizeCode(raw: string): string {
  return raw.toUpperCase().trim();
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function toDateInputValue(expiresAt?: string): string {
  if (!expiresAt) return '';
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Expiracion: ultimo dia incluido -> guardamos 23:59:59
function toExpiresAtIso(dateStr: string): string | undefined {
  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  return `${trimmed}T23:59:59`;
}

interface CouponFormState {
  code: string;
  name: string;
  discountType: CouponDiscountType;
  discountValue: number;
  expiresDate: string;
}

function CouponFormModal({
  isOpen,
  mode,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial: CouponFormState;
  onClose: () => void;
  onSubmit: (state: CouponFormState) => Promise<void>;
  isSubmitting: boolean;
}) {
  const { showToast } = useUI();
  const [state, setState] = useState<CouponFormState>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial, isOpen]);

  const codeValid = useMemo(() => {
    const code = normalizeCode(state.code);
    return /^[A-Z0-9-]{3,50}$/.test(code);
  }, [state.code]);

  const valueValid = useMemo(() => {
    if (!Number.isFinite(state.discountValue)) return false;
    if (state.discountType === 'PERCENTAGE') {
      return state.discountValue > 0 && state.discountValue <= 100;
    }
    return state.discountValue > 0;
  }, [state.discountType, state.discountValue]);

  const canSubmit = (mode === 'edit' || codeValid) && state.name.trim().length >= 3 && valueValid;

  const discountTypeOptions = useMemo(() => (
    [
      { value: 'PERCENTAGE', label: 'Porcentaje sobre el total (%)' },
      { value: 'FIXED_AMOUNT', label: 'Monto fijo sobre el total (€)' },
    ]
  ), []);

  const handleSubmit = async () => {
    const payload: CouponFormState = {
      ...state,
      code: normalizeCode(state.code),
      name: state.name.trim(),
      expiresDate: state.expiresDate.trim(),
    };
    if (mode === 'create' && !/^[A-Z0-9-]{3,50}$/.test(payload.code)) {
      showToast('Código inválido. Usa 3-50 caracteres: A-Z, 0-9 y guiones', 'error');
      return;
    }
    if (!canSubmit) {
      showToast('Revisa el formulario antes de guardar', 'error');
      return;
    }
    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo cupón' : 'Editar cupón'}
      autoSize
    >
      <FormCard plain>
        <div className="coupons-form">
          <Input
            label="Código"
            placeholder="EJ: BIENVENIDA-10"
            value={state.code}
            onChange={(e) => setState((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            disabled={isSubmitting || mode === 'edit'}
          />

          <Input
            label="Nombre"
            placeholder="Ej: Bienvenida"
            value={state.name}
            onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
            disabled={isSubmitting}
          />

          <Select
            label="Tipo de descuento"
            value={state.discountType}
            onChange={(e) => setState((p) => ({ ...p, discountType: e.target.value as CouponDiscountType }))}
            options={discountTypeOptions}
            disabled={isSubmitting}
          />

          <NumberInput
            label={state.discountType === 'PERCENTAGE' ? 'Porcentaje (%)' : 'Monto (€)'}
            value={state.discountValue}
            onChange={(v) => setState((p) => ({ ...p, discountValue: v }))}
            min={0}
            max={state.discountType === 'PERCENTAGE' ? 100 : undefined}
            step={state.discountType === 'PERCENTAGE' ? 1 : 0.01}
            disabled={isSubmitting}
            placeholder={state.discountType === 'PERCENTAGE' ? 'Ej: 10' : 'Ej: 2'}
          />

          <Input
            type="date"
            label="Expira (opcional)"
            value={state.expiresDate}
            onChange={(e) => setState((p) => ({ ...p, expiresDate: e.target.value }))}
            disabled={isSubmitting}
          />

          <div className="coupons-form-actions">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} loading={isSubmitting}>
              Guardar
            </Button>
          </div>
        </div>
      </FormCard>
    </Modal>
  );
}

export function CouponsPage() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { hasPermission } = useAuth();
  const canManageCoupons = hasPermission(AdminPermission.GESTIONAR_CUPONES);

  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!canManageCoupons) {
      showToast('No tienes permisos para gestionar cupones', 'error');
      navigate('/home', { replace: true });
    }
  }, [canManageCoupons, navigate, showToast]);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couponsService.getAll();
      setCoupons(data);
    } catch (e: any) {
      showToast(e?.message || 'Error al cargar cupones', 'error');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (canManageCoupons) {
      loadCoupons();
    }
  }, [canManageCoupons, loadCoupons]);

  const filteredCoupons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons
      .filter((c) => {
        if (!q) return true;
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      })
      .filter((c) => {
        const expired = isExpired(c.expiresAt);
        const active = c.isActive;
        const valid = active && !expired;

        switch (filter) {
          case 'ACTIVE':
            return valid;
          case 'EXPIRED':
            return expired;
          case 'DISABLED':
            return !active;
          default:
            return true;
        }
      });
  }, [coupons, filter, search]);

  const handleCreate = useCallback(async (form: CouponFormState) => {
    setSubmitting(true);
    try {
      const payload: CreateCouponRequest = {
        code: normalizeCode(form.code),
        name: form.name.trim(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        expiresAt: toExpiresAtIso(form.expiresDate),
      };
      await couponsService.create(payload);
      showToast('Cupón creado', 'success');
      setCreateOpen(false);
      await loadCoupons();
    } catch (e: any) {
      showToast(e?.message || 'Error al crear cupón', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [loadCoupons, showToast]);

  const handleEdit = useCallback(async (form: CouponFormState) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const payload: UpdateCouponRequest = {
        name: form.name.trim(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        expiresAt: toExpiresAtIso(form.expiresDate),
      };
      await couponsService.update(editTarget.id, payload);
      showToast('Cupón actualizado', 'success');
      setEditTarget(null);
      await loadCoupons();
    } catch (e: any) {
      showToast(e?.message || 'Error al actualizar cupón', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editTarget, loadCoupons, showToast]);

  const handleToggle = useCallback(async (coupon: Coupon) => {
    setSubmitting(true);
    try {
      await couponsService.toggleStatus(coupon.id, !coupon.isActive);
      showToast(coupon.isActive ? 'Cupón desactivado' : 'Cupón activado', 'success');
      await loadCoupons();
    } catch (e: any) {
      showToast(e?.message || 'Error al cambiar estado', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [loadCoupons, showToast]);

  const columns: ColumnDef<Coupon>[] = useMemo(() => {
    return [
      {
        header: 'Código',
        accessor: 'code',
        cell: (value: any) => (
          <span className="coupon-code-cell">
            <HiOutlineTicket className="coupon-code-icon" />
            {value}
          </span>
        ),
      },
      { header: 'Nombre', accessor: 'name' },
      {
        header: 'Descuento',
        accessor: (row) => {
          if (row.discountType === 'PERCENTAGE') {
            return `${row.discountValue}%`;
          }
          return `${row.discountValue.toFixed(2)}€`;
        },
      },
      {
        header: 'Expira',
        accessor: (row) => {
          const d = toDateInputValue(row.expiresAt);
          return d || '-';
        },
      },
      {
        header: 'Estado',
        accessor: (row) => {
          const expired = isExpired(row.expiresAt);
          const active = row.isActive;
          const valid = active && !expired;
          return (
            <span
              className={`coupon-status-chip ${valid ? 'coupon-status-valid' : expired ? 'coupon-status-expired' : 'coupon-status-disabled'}`}
            >
              {valid ? 'Activo' : expired ? 'Expirado' : 'Desactivado'}
            </span>
          );
        },
      },
      {
        header: 'Acciones',
        accessor: (row) => (
          <div className="coupon-actions">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setEditTarget(row)}
              disabled={submitting}
            >
              <span className="coupon-action-btn">
                <HiPencil /> Editar
              </span>
            </Button>
            <Button
              variant={row.isActive ? 'danger' : 'primary'}
              size="small"
              onClick={() => handleToggle(row)}
              disabled={submitting}
            >
              <span className="coupon-action-btn">
                {row.isActive ? <HiOutlineX /> : <HiOutlineCheck />} {row.isActive ? 'Desactivar' : 'Activar'}
              </span>
            </Button>
          </div>
        ),
      },
    ];
  }, [handleToggle, submitting]);

  const createInitial: CouponFormState = useMemo(() => ({
    code: '',
    name: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    expiresDate: '',
  }), []);

  const editInitial: CouponFormState = useMemo(() => {
    if (!editTarget) {
      return createInitial;
    }
    return {
      code: editTarget.code,
      name: editTarget.name,
      discountType: editTarget.discountType,
      discountValue: editTarget.discountValue,
      expiresDate: toDateInputValue(editTarget.expiresAt),
    };
  }, [createInitial, editTarget]);

  if (!canManageCoupons) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Cupones"
        action={{
          label: '+ Nuevo cupón',
          onClick: () => setCreateOpen(true),
          dataTour: 'create-coupon',
        }}
      />

      <div className="coupons-page-container">
        <div className="coupons-toolbar">
          <Input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '420px', width: '100%' }}
          />
          <div className="coupons-filters">
            <button
              type="button"
              className={`coupons-filter ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`coupons-filter ${filter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setFilter('ACTIVE')}
            >
              Activos
            </button>
            <button
              type="button"
              className={`coupons-filter ${filter === 'EXPIRED' ? 'active' : ''}`}
              onClick={() => setFilter('EXPIRED')}
            >
              Expirados
            </button>
            <button
              type="button"
              className={`coupons-filter ${filter === 'DISABLED' ? 'active' : ''}`}
              onClick={() => setFilter('DISABLED')}
            >
              Desactivados
            </button>
          </div>
        </div>

        {loading ? (
          <div className="coupons-loading">
            <Spinner size="lg" />
          </div>
        ) : (
          <CardList
            columns={columns}
            data={filteredCoupons.map((c) => ({ ...c, key: c.id }))}
            loading={false}
            emptyMessage="No hay cupones para mostrar"
            renderCard={(c) => {
              const expired = isExpired(c.expiresAt);
              const valid = c.isActive && !expired;
              return (
                <div className="coupon-card">
                  <div className="coupon-card-top">
                    <div className="coupon-card-title">
                      <HiOutlineTicket />
                      <span className="coupon-card-code">{c.code}</span>
                    </div>
                    <span className={`coupon-status-chip ${valid ? 'coupon-status-valid' : expired ? 'coupon-status-expired' : 'coupon-status-disabled'}`}>
                      {valid ? 'Activo' : expired ? 'Expirado' : 'Desactivado'}
                    </span>
                  </div>
                  <div className="coupon-card-name">{c.name}</div>
                  <div className="coupon-card-meta">
                    <span>
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.discountValue}% sobre el total`
                        : `${c.discountValue.toFixed(2)}€ sobre el total`}
                    </span>
                    <span>Expira: {toDateInputValue(c.expiresAt) || '-'}</span>
                  </div>
                  <div className="coupon-card-actions">
                    <Button variant="secondary" size="small" onClick={() => setEditTarget(c)} disabled={submitting}>
                      <HiPencil /> Editar
                    </Button>
                    <Button
                      variant={c.isActive ? 'danger' : 'primary'}
                      size="small"
                      onClick={() => handleToggle(c)}
                      disabled={submitting}
                    >
                      {c.isActive ? <HiOutlineX /> : <HiOutlineCheck />} {c.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      <CouponFormModal
        isOpen={createOpen}
        mode="create"
        initial={createInitial}
        onClose={() => !submitting && setCreateOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={submitting}
      />

      <CouponFormModal
        isOpen={!!editTarget}
        mode="edit"
        initial={editInitial}
        onClose={() => !submitting && setEditTarget(null)}
        onSubmit={handleEdit}
        isSubmitting={submitting}
      />
    </>
  );
}
