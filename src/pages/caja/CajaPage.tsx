import { useState, useEffect } from 'react';
import { Spinner } from '@/components/common/Spinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useUI } from '@/context/ui.context';
import { useCajaActual } from '@/hooks/caja/useCajaActual';
import { useCierreCaja } from '@/hooks/caja/useCierreCaja';
import { useCajasHistorial } from '@/hooks/caja/useCajasHistorial';
import { useExportarCajas } from '@/hooks/caja/useExportarCajas';
import { useAjusteCaja } from '@/hooks/caja/useAjusteCaja';
import { cajaService } from '@/services/caja/caja.service';
import { EstadoSinCaja } from '@/components/caja/EstadoSinCaja';
import { CajaActualCard } from '@/components/caja/CajaActualCard';
import { CerrarCajaModal } from '@/components/caja/CerrarCajaModal';
import { AjusteModal } from '@/components/caja/AjusteModal';
import { CajaList } from '@/components/caja/CajaList';
import { ExportarModal } from '@/components/caja/ExportarModal';
import { MonthRangeSelector } from '@/components/caja/MonthRangeSelector';
import type { DateRange } from '@/components/caja/MonthRangeSelector';
import { getFirstDayOfMonthISOFrom, getLastDayOfMonthISO } from '@/utils/dateUtils';
import type { CerrarCajaResponse } from '@/types/caja';
import { HiOutlineDownload } from 'react-icons/hi';
import './CajaPage.css';

export function CajaPage() {
  // Hooks
  const { caja, loading: loadingCaja, error: errorCaja, needsInitialization, refetch: refetchCaja } = useCajaActual();
  const { prepararCierre, cerrarCaja, loading: loadingCierre } = useCierreCaja();
  const { cajas, loading: loadingHistorial, hasMore, loadMore, fetchCajas } = useCajasHistorial();
  const { exportar, loading: loadingExport } = useExportarCajas();
  const { ajusteEntrada, ajusteSalida, loading: loadingAjuste } = useAjusteCaja();
  const { showToast } = useUI();

  // Estados de modales
  const [modalCerrarOpen, setModalCerrarOpen] = useState(false);
  const [modalAjusteEntradaOpen, setModalAjusteEntradaOpen] = useState(false);
  const [modalAjusteSalidaOpen, setModalAjusteSalidaOpen] = useState(false);
  const [modalExportarOpen, setModalExportarOpen] = useState(false);

  // Rango de fechas del historial (por defecto: mes actual completo)
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    desde: getFirstDayOfMonthISOFrom(now.getFullYear(), now.getMonth() + 1),
    hasta: getLastDayOfMonthISO(now.getFullYear(), now.getMonth() + 1),
  });

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range);
    fetchCajas({
      desde: range.desde,
      hasta: range.hasta,
      page: 0,
      size: 20,
    });
  };

  // Cargar historial inicial
  useEffect(() => {
    fetchCajas({
      desde: dateRange.desde,
      hasta: dateRange.hasta,
      page: 0,
      size: 20,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleInicializar = async () => {
    try {
      await cajaService.inicializarPrimeraCaja();
      showToast('Primera caja creada exitosamente', 'success');
      refetchCaja();
    } catch (err: any) {
      showToast(err?.message || 'Error al crear primera caja', 'error');
    }
  };

  const handleCerrarCaja = async (request: { montoFinalReal: number; montoDejadoSiguiente: number }) => {
    if (!caja) return;
    try {
      const response: CerrarCajaResponse = await cerrarCaja(caja.id, request);
      setModalCerrarOpen(false);
      showToast(
        `Caja ${response.cajaCerrada.numeroCaja} cerrada. Nueva caja: ${response.nuevaCaja.numeroCaja}`,
        'success'
      );
      refetchCaja();
      fetchCajas({
        desde: dateRange.desde,
        hasta: dateRange.hasta,
        page: 0,
        size: 20,
      });
    } catch (err: any) {
      showToast(err?.message || 'Error al cerrar caja', 'error');
    }
  };

  const handleAjusteEntrada = async (monto: number, notas: string) => {
    if (!caja) return;
    try {
      await ajusteEntrada(caja.id, { monto, notas });
      setModalAjusteEntradaOpen(false);
      showToast('Ajuste de entrada registrado', 'success');
      refetchCaja();
    } catch (err: any) {
      showToast(err?.message || 'Error en ajuste', 'error');
    }
  };

  const handleAjusteSalida = async (monto: number, notas: string) => {
    if (!caja) return;
    try {
      await ajusteSalida(caja.id, { monto, notas });
      setModalAjusteSalidaOpen(false);
      showToast('Ajuste de salida registrado', 'success');
      refetchCaja();
    } catch (err: any) {
      showToast(err?.message || 'Error en ajuste', 'error');
    }
  };

  const handleExportar = async (cajaIds: string[], incluirTransacciones: boolean, formato: 'PDF' | 'EXCEL') => {
    try {
      await exportar({ cajaIds, incluirTransacciones, formato }, `cajas-report.${formato.toLowerCase()}`);
      setModalExportarOpen(false);
      showToast('Exportación completada', 'success');
    } catch (err) {
      showToast('Error al exportar', 'error');
    }
  };

  // Render
  if (needsInitialization) {
    return (
      <div className="caja-page">
        <PageHeader title="Gestión de Cajas" />
        <EstadoSinCaja onInicializar={handleInicializar} />
      </div>
    );
  }

  if (loadingCaja && !caja) {
    return (
      <div className="caja-page">
        <PageHeader title="Gestión de Cajas" />
        <div className="caja-loading">
          <Spinner size="lg" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (errorCaja) {
    return (
      <div className="caja-page">
        <PageHeader title="Gestión de Cajas" />
        <div className="alerta-error">
          Error al cargar la caja: {errorCaja.message}
        </div>
      </div>
    );
  }

  return (
    <div className="caja-page">
      <PageHeader 
        title="Gestión de Cajas"
        action={{
          label: 'Exportar',
          onClick: () => setModalExportarOpen(true),
          icon: HiOutlineDownload,
          variant: 'secondary'
        }}
      />

      {/* Caja Actual */}
      {caja && (
        <div className="caja-actual-section">
          <CajaActualCard
            caja={caja}
            onCerrarClick={() => setModalCerrarOpen(true)}
            onAjusteEntradaClick={() => setModalAjusteEntradaOpen(true)}
            onAjusteSalidaClick={() => setModalAjusteSalidaOpen(true)}
          />
        </div>
      )}

      {/* Historial */}
      <div className="caja-historial-section">
        <div className="caja-historial-header">
          <h2>Historial de Cajas</h2>
          <MonthRangeSelector
            value={dateRange}
            onChange={handleRangeChange}
          />
        </div>
        <CajaList
          cajas={cajas}
          onLoadMore={loadMore}
          hasMore={hasMore}
          loading={loadingHistorial}
          onExportarClick={(id) => handleExportar([id], true, 'PDF')}
        />
      </div>

      {/* Modales */}
      {caja && (
        <>
          <CerrarCajaModal
            isOpen={modalCerrarOpen}
            onClose={() => setModalCerrarOpen(false)}
            onConfirm={handleCerrarCaja}
            caja={caja}
            prepararCierre={prepararCierre}
            loading={loadingCierre}
          />

          <AjusteModal
            isOpen={modalAjusteEntradaOpen}
            onClose={() => setModalAjusteEntradaOpen(false)}
            onConfirm={handleAjusteEntrada}
            tipo="entrada"
            loading={loadingAjuste}
          />

          <AjusteModal
            isOpen={modalAjusteSalidaOpen}
            onClose={() => setModalAjusteSalidaOpen(false)}
            onConfirm={handleAjusteSalida}
            tipo="salida"
            saldoActual={caja?.montoTeorico}
            loading={loadingAjuste}
          />
        </>
      )}

      <ExportarModal
        isOpen={modalExportarOpen}
        onClose={() => setModalExportarOpen(false)}
        onExport={handleExportar}
        cajas={cajas}
        loading={loadingExport}
      />
    </div>
  );
}
