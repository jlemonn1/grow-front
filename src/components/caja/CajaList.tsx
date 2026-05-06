import { useState } from 'react';
import { Button } from '@/components/common/Button';
import type { CajaResumen } from '@/types/caja';
import { formatCurrency } from '@/utils/formatters';
import { formatDateShort, formatDate } from '@/utils/dateUtils';
import { HiChevronDown, HiChevronUp, HiOutlineDownload } from 'react-icons/hi';
import './CajaList.css';

interface CajaListProps {
  cajas: CajaResumen[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onExportarClick?: (cajaId: string) => void;
}

export function CajaList({
  cajas,
  onLoadMore,
  hasMore = false,
  loading = false,
  onExportarClick,
}: CajaListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (cajas.length === 0) {
    return (
      <div className="caja-list-empty">
        <p>No hay cajas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="caja-list">
      {cajas.map((caja, index) => (
        <div key={caja.id} className="caja-list-item">
          <div 
            className="caja-list-header"
            onClick={() => handleToggle(caja.id)}
          >
            <div className="caja-list-info">
              <span className="caja-list-numero">{caja.numeroCaja}</span>
              <span className="caja-list-fecha">{formatDateShort(caja.fecha)}</span>
            </div>
            <div className="caja-list-badges">
              <span className={`caja-estado-badge caja-estado-${caja.estado.toLowerCase()}`}>
                {caja.estado}
              </span>
              {expandedId === caja.id ? <HiChevronUp /> : <HiChevronDown />}
            </div>
          </div>

          {caja.estado === 'CERRADA' && (
            <div className="caja-list-resumen">
              <span>Retirado: {formatCurrency(caja.montoRetirado)}</span>
              {caja.diferenciaArqueo !== undefined && caja.diferenciaArqueo !== 0 && (
                <span className={caja.diferenciaArqueo > 0 ? 'text-success' : 'text-danger'}>
                  Dif: {caja.diferenciaArqueo > 0 ? '+' : ''}
                  {formatCurrency(caja.diferenciaArqueo)}
                </span>
              )}
            </div>
          )}

          {expandedId === caja.id && (
            <div className="caja-list-detalle">
              {/* Sección: Información General */}
              <div className="caja-detalle-seccion">
                <h4 className="caja-detalle-titulo">Información General</h4>
                <div className="caja-detalle-grid">
                  <div className="caja-detalle-item">
                    <span className="caja-detalle-label">Monto Inicial</span>
                    <span className="caja-detalle-valor">{formatCurrency(caja.montoInicial)}</span>
                  </div>
                  <div className="caja-detalle-item">
                    <span className="caja-detalle-label">Monto Teórico</span>
                    <span className="caja-detalle-valor">{formatCurrency(caja.montoTeorico)}</span>
                  </div>
                  {caja.montoFinalReal !== undefined && (
                    <div className="caja-detalle-item">
                      <span className="caja-detalle-label">Monto Final Real</span>
                      <span className="caja-detalle-valor">{formatCurrency(caja.montoFinalReal)}</span>
                    </div>
                  )}
                  {caja.montoDejadoSiguiente !== undefined && (
                    <div className="caja-detalle-item">
                      <span className="caja-detalle-label">Dejado Siguiente</span>
                      <span className="caja-detalle-valor">{formatCurrency(caja.montoDejadoSiguiente)}</span>
                    </div>
                  )}
                  {caja.montoRetirado !== undefined && (
                    <div className="caja-detalle-item">
                      <span className="caja-detalle-label">Retirado</span>
                      <span className="caja-detalle-valor">{formatCurrency(caja.montoRetirado)}</span>
                    </div>
                  )}
                  {caja.diferenciaArqueo !== undefined && (
                    <div className="caja-detalle-item">
                      <span className="caja-detalle-label">Diferencia</span>
                      <span className={`caja-detalle-valor ${caja.diferenciaArqueo >= 0 ? 'text-success' : 'text-danger'}`}>
                        {caja.diferenciaArqueo > 0 ? '+' : ''}
                        {formatCurrency(caja.diferenciaArqueo)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección: Movimientos */}
              <div className="caja-detalle-seccion">
                <h4 className="caja-detalle-titulo">Movimientos</h4>
                <div className="caja-detalle-grid">
                  <div className="caja-detalle-item caja-detalle-positivo">
                    <span className="caja-detalle-label">Ventas</span>
                    <span className="caja-detalle-valor text-success">{formatCurrency(caja.totalVentas)}</span>
                  </div>
                  <div className="caja-detalle-item caja-detalle-negativo">
                    <span className="caja-detalle-label">Cambios</span>
                    <span className="caja-detalle-valor text-danger">{formatCurrency(caja.totalCambios)}</span>
                  </div>
                  <div className="caja-detalle-item caja-detalle-info">
                    <span className="caja-detalle-label">Suscripciones</span>
                    <span className="caja-detalle-valor text-info">{formatCurrency(caja.totalSuscripciones)}</span>
                  </div>
                  {caja.totalAjustesEntrada > 0 && (
                    <div className="caja-detalle-item caja-detalle-positivo">
                      <span className="caja-detalle-label">Ajustes Entrada</span>
                      <span className="caja-detalle-valor text-success">{formatCurrency(caja.totalAjustesEntrada)}</span>
                    </div>
                  )}
                  {caja.totalAjustesSalida > 0 && (
                    <div className="caja-detalle-item caja-detalle-negativo">
                      <span className="caja-detalle-label">Ajustes Salida</span>
                      <span className="caja-detalle-valor text-danger">{formatCurrency(caja.totalAjustesSalida)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección: Información de Apertura/Cierre */}
              <div className="caja-detalle-seccion">
                <h4 className="caja-detalle-titulo">Operadores</h4>
                <div className="caja-detalle-grid caja-detalle-grid-2cols">
                  <div className="caja-detalle-item">
                    <span className="caja-detalle-label">Abierta por</span>
                    <span className="caja-detalle-valor">{caja.abiertaPorUsername || 'N/A'}</span>
                  </div>
                  <div className="caja-detalle-item">
                    <span className="caja-detalle-label">Fecha Apertura</span>
                    <span className="caja-detalle-valor">{formatDate(caja.fechaApertura)}</span>
                  </div>
                  {caja.cerradaPorUsername && (
                    <div className="caja-detalle-item">
                      <span className="caja-detalle-label">Cerrada por</span>
                      <span className="caja-detalle-valor">{caja.cerradaPorUsername}</span>
                    </div>
                  )}
                  {caja.fechaCierre && (
                    <div className="caja-detalle-item">
                      <span className="caja-detalle-label">Fecha Cierre</span>
                      <span className="caja-detalle-valor">{formatDate(caja.fechaCierre)}</span>
                    </div>
                  )}
                </div>
              </div>

              {onExportarClick && (
                <div className="caja-detalle-actions">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => onExportarClick(caja.id)}
                    icon={<HiOutlineDownload />}
                  >
                    Exportar esta caja
                  </Button>
                </div>
              )}
            </div>
          )}

          {index < cajas.length - 1 && <hr className="caja-list-divider" />}
        </div>
      ))}

      {hasMore && onLoadMore && (
        <div className="caja-list-load-more">
          <Button onClick={onLoadMore} loading={loading} variant="secondary">
            {loading ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  );
}
