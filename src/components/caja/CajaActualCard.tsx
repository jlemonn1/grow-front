import { useState } from 'react';
import { Button } from '@/components/common/Button';
import type { Caja } from '@/types/caja';
import { formatCurrency } from '@/utils/formatters';
import { formatDate } from '@/utils/dateUtils';
import { 
  HiOutlineLockClosed, 
  HiOutlinePlus, 
  HiOutlineMinus,
  HiChevronDown,
  HiChevronUp 
} from 'react-icons/hi';
import './CajaActualCard.css';

interface CajaActualCardProps {
  caja: Caja;
  onCerrarClick: () => void;
  onAjusteEntradaClick: () => void;
  onAjusteSalidaClick: () => void;
}

export function CajaActualCard({
  caja,
  onCerrarClick,
  onAjusteEntradaClick,
  onAjusteSalidaClick,
}: CajaActualCardProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="caja-actual-card">
      {/* Header */}
      <div className="caja-actual-header">
        <div className="caja-actual-title-section">
          <span className="caja-actual-label">Caja Actual</span>
          <h1 className="caja-actual-numero">{caja.numeroCaja}</h1>
        </div>
        <div className="caja-actual-badges">
          <span className={`caja-estado-badge caja-estado-${caja.estado.toLowerCase()}`}>
            {caja.estado}
          </span>
          <button 
            className="caja-expand-btn"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Monto Teórico Destacado */}
      <div className="caja-teorico-box">
        <span className="caja-teorico-label">Monto Teórico Actual</span>
        <span className="caja-teorico-monto">{formatCurrency(caja.montoTeorico)}</span>
      </div>

      {/* Botones de Acción */}
      <div className="caja-acciones">
        <Button
          variant="primary"
          onClick={onCerrarClick}
          icon={<HiOutlineLockClosed />}
        >
          Cerrar Caja
        </Button>
        <Button
          variant="secondary"
          onClick={onAjusteEntradaClick}
          icon={<HiOutlinePlus />}
        >
          Ajuste Entrada
        </Button>
        <Button
          variant="secondary"
          onClick={onAjusteSalidaClick}
          icon={<HiOutlineMinus />}
        >
          Ajuste Salida
        </Button>
      </div>

      {/* Contenido Expandido */}
      {expandido && (
        <div className="caja-detalle">
          <h3>Detalle de Movimientos</h3>
          
          <div className="caja-movimientos-grid">
            <div className="caja-movimiento-item caja-movimiento-inicial">
              <span className="caja-movimiento-label">Monto Inicial</span>
              <span className="caja-movimiento-valor">{formatCurrency(caja.montoInicial)}</span>
            </div>
            <div className="caja-movimiento-item caja-movimiento-positivo">
              <span className="caja-movimiento-label">Ventas</span>
              <span className="caja-movimiento-valor">{formatCurrency((caja.totalVentas || 0) - (caja.totalCambios || 0))}</span>
            </div>
            <div className="caja-movimiento-item caja-movimiento-info">
              <span className="caja-movimiento-label">Suscripciones</span>
              <span className="caja-movimiento-valor">{formatCurrency(caja.totalSuscripciones)}</span>
            </div>
          </div>

          {(caja.totalAjustesEntrada > 0 || caja.totalAjustesSalida > 0) && (
            <div className="caja-movimientos-grid" style={{ marginTop: '8px' }}>
              {caja.totalAjustesEntrada > 0 && (
                <div className="caja-movimiento-item caja-movimiento-positivo">
                  <span className="caja-movimiento-label">Ajustes Entrada</span>
                  <span className="caja-movimiento-valor">{formatCurrency(caja.totalAjustesEntrada)}</span>
                </div>
              )}
              {caja.totalAjustesSalida > 0 && (
                <div className="caja-movimiento-item caja-movimiento-negativo">
                  <span className="caja-movimiento-label">Ajustes Salida</span>
                  <span className="caja-movimiento-valor">{formatCurrency(caja.totalAjustesSalida)}</span>
                </div>
              )}
            </div>
          )}

          <div className="caja-footer">
            Abierta el {formatDate(caja.fechaApertura)} por {caja.abiertaPorUsername || 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
}
