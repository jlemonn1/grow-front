import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { CajaResumen } from '@/types/caja';
import { HiOutlineDocumentText, HiOutlineTable } from 'react-icons/hi';
import './ExportarModal.css';

interface ExportarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (cajaIds: string[], incluirTransacciones: boolean, formato: 'PDF' | 'EXCEL') => void;
  cajas: CajaResumen[];
  loading?: boolean;
}

export function ExportarModal({
  isOpen,
  onClose,
  onExport,
  cajas,
  loading = false,
}: ExportarModalProps) {
  const [formato, setFormato] = useState<'PDF' | 'EXCEL'>('PDF');
  const [incluirTransacciones, setIncluirTransacciones] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleCaja = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === cajas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cajas.map((c) => c.id));
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) return;
    onExport(selectedIds, incluirTransacciones, formato);
  };

  const handleClose = () => {
    setSelectedIds([]);
    setIncluirTransacciones(false);
    setFormato('PDF');
    onClose();
  };

  const allSelected = selectedIds.length === cajas.length && cajas.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Exportar Cajas" autoSize={true}>
      <div className="exportar-modal">
        {selectedIds.length === 0 && (
          <div className="alerta-info">
            Selecciona al menos una caja para exportar
          </div>
        )}

        {/* Formato */}
        <div className="form-group">
          <label>Formato</label>
          <div className="formato-options">
            <button
              className={`formato-option ${formato === 'PDF' ? 'formato-selected' : ''}`}
              onClick={() => setFormato('PDF')}
            >
              <HiOutlineDocumentText size={24} />
              <span>PDF</span>
            </button>
            <button
              className={`formato-option ${formato === 'EXCEL' ? 'formato-selected' : ''}`}
              onClick={() => setFormato('EXCEL')}
            >
              <HiOutlineTable size={24} />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Opciones */}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={incluirTransacciones}
            onChange={(e) => setIncluirTransacciones(e.target.checked)}
          />
          Incluir transacciones detalladas
        </label>

        {/* Lista de cajas */}
        <div className="form-group">
          <label>Seleccionar Cajas</label>
          <label className="checkbox-label checkbox-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleSelectAll}
            />
            Seleccionar todas
          </label>

          <div className="cajas-seleccion-list">
            {cajas.map((caja) => (
              <label key={caja.id} className="caja-seleccion-item">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(caja.id)}
                  onChange={() => handleToggleCaja(caja.id)}
                />
                <span className="caja-seleccion-numero">{caja.numeroCaja}</span>
                <span className="caja-seleccion-info">
                  {caja.fecha} - {caja.estado}
                </span>
              </label>
            ))}
          </div>
        </div>

        <p className="cajas-seleccion-count">
          {selectedIds.length} caja(s) seleccionada(s)
        </p>

        <div className="modal-actions">
          <Button onClick={handleClose} disabled={loading} variant="secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            loading={loading}
            disabled={selectedIds.length === 0}
          >
            Exportar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
