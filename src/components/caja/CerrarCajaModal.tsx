import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { NumericKeypad } from '@/components/common/NumericKeypad';
import { useUI } from '@/context/ui.context';
import type { Caja, PrepararCierreResponse, CerrarCajaRequest } from '@/types/caja';
import { formatCurrency } from '@/utils/formatters';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import './CerrarCajaModal.css';

interface CerrarCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (request: CerrarCajaRequest) => void;
  caja: Caja;
  prepararCierre: (cajaId: string) => Promise<PrepararCierreResponse>;
  loading: boolean;
}

const STEPS = ['Preparar Cierre', 'Confirmar'];

export function CerrarCajaModal({
  isOpen,
  onClose,
  onConfirm,
  caja,
  prepararCierre,
  loading,
}: CerrarCajaModalProps) {
  const { showToast } = useUI();
  const [activeStep, setActiveStep] = useState(0);
  const [prepararData, setPrepararData] = useState<PrepararCierreResponse | null>(null);
  const [montoFinalReal, setMontoFinalReal] = useState('');
  const [montoDejado, setMontoDejado] = useState('');
  const [activeKeypad, setActiveKeypad] = useState<'final' | 'dejado'>('final');
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    if (isOpen && activeStep === 0) {
      cargarDatosPreparar();
    }
  }, [isOpen, activeStep]);

  const cargarDatosPreparar = async () => {
    setCargandoDatos(true);
    try {
      const data = await prepararCierre(caja.id);
      setPrepararData(data);
      setMontoFinalReal(data.montoTeoricoCalculado.toFixed(2));
      setMontoDejado('0');
    } catch (err: any) {
      showToast(err?.message || 'Error al cargar datos de cierre', 'error');
    } finally {
      setCargandoDatos(false);
    }
  };

  const getDiferencia = () => {
    const final = parseFloat(montoFinalReal) || 0;
    return final - (prepararData?.montoTeoricoCalculado || 0);
  };

  const getMontoRetirar = () => {
    const final = parseFloat(montoFinalReal) || 0;
    const dejado = parseFloat(montoDejado) || 0;
    return final - dejado;
  };

  const handleNext = () => {
    const final = parseFloat(montoFinalReal) || 0;
    const dejado = parseFloat(montoDejado) || 0;

    if (activeStep === 0) {
      if (final < 0) {
        showToast('El monto final no puede ser negativo', 'warning');
        return;
      }
      if (dejado < 0) {
        showToast('El monto a dejar no puede ser negativo', 'warning');
        return;
      }
      if (dejado > final) {
        showToast('El monto a dejar no puede ser mayor que el monto final', 'warning');
        return;
      }
      setActiveStep(1);
    } else {
      onConfirm({
        montoFinalReal: final,
        montoDejadoSiguiente: dejado,
      });
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setPrepararData(null);
    setMontoFinalReal('');
    setMontoDejado('');
    onClose();
  };

  const diferencia = getDiferencia();
  const montoRetirar = getMontoRetirar();
  const hayDiferencia = Math.abs(diferencia) > 0.01;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cerrar Caja"
      autoSize={true}
    >
      <div className="cerrar-caja-modal">
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`step ${index === activeStep ? 'step-active' : ''} ${
                index < activeStep ? 'step-completed' : ''
              }`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {activeStep === 0 && (
          <>
            {cargandoDatos ? (
              <div className="cargando-datos">Cargando datos...</div>
            ) : (
              <div className="cerrar-caja-step-content">
                {/* Columna Izquierda: Keypad */}
                <div className="cerrar-caja-keypad-section">
                  <div className="caja-teorico-box">
                    <span className="caja-teorico-label">Monto Teórico Calculado</span>
                    <span className="caja-teorico-monto">
                      {formatCurrency(prepararData?.montoTeoricoCalculado || 0)}
                    </span>
                  </div>
                  
                  <NumericKeypad
                    value={activeKeypad === 'final' ? montoFinalReal : montoDejado}
                    onChange={activeKeypad === 'final' ? setMontoFinalReal : setMontoDejado}
                    disabled={loading}
                    showSubmit={false}
                  />
                </div>
                
                {/* Columna Derecha: Formulario y Resumen */}
                <div className="cerrar-caja-form-section">
                  {/* Selector de campo activo */}
                  <div className="form-group">
                    <label>Monto Final Real (contado físicamente)</label>
                    <button
                      className={`form-input-like ${activeKeypad === 'final' ? 'form-input-active' : ''}`}
                      onClick={() => setActiveKeypad('final')}
                    >
                      {formatCurrency(parseFloat(montoFinalReal) || 0)}
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Monto a Dejar para la Siguiente Caja</label>
                    <button
                      className={`form-input-like ${activeKeypad === 'dejado' ? 'form-input-active' : ''}`}
                      onClick={() => setActiveKeypad('dejado')}
                    >
                      {formatCurrency(parseFloat(montoDejado) || 0)}
                    </button>
                  </div>
                  
                  {/* Preview */}
                  <div className="caja-resumen-preview">
                    <div className="caja-resumen-row">
                      <span>Monto a Retirar:</span>
                      <strong>{formatCurrency(montoRetirar)}</strong>
                    </div>
                    <div className="caja-resumen-row">
                      <span>Diferencia:</span>
                      <strong className={diferencia >= 0 ? 'text-success' : 'text-danger'}>
                        {diferencia >= 0 ? '+' : ''}
                        {formatCurrency(diferencia)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeStep === 1 && (
          <div className="cerrar-caja-step-content">
            <div className="cerrar-caja-paso-2">
            {hayDiferencia && (
              <div className="alerta-diferencia">
                <HiOutlineInformationCircle size={24} />
                <div>
                  <strong>Hay una diferencia de {formatCurrency(Math.abs(diferencia))}</strong>
                  <p>
                    El monto contado ({formatCurrency(parseFloat(montoFinalReal) || 0)}) no coincide con el monto
                    teórico ({formatCurrency(prepararData?.montoTeoricoCalculado || 0)}).
                  </p>
                </div>
              </div>
            )}

            <div className="caja-confirmacion-box">
              <h4>Confirmación de Cierre</h4>
              
              <div className="caja-confirmacion-row">
                <span>Monto Teórico:</span>
                <span>{formatCurrency(prepararData?.montoTeoricoCalculado || 0)}</span>
              </div>
              <div className="caja-confirmacion-row">
                <span>Monto Contado:</span>
                <span>{formatCurrency(parseFloat(montoFinalReal) || 0)}</span>
              </div>
              
              {hayDiferencia && (
                <div className="caja-confirmacion-row">
                  <span>Diferencia:</span>
                  <span className={diferencia >= 0 ? 'text-success' : 'text-danger'}>
                    {diferencia >= 0 ? '+' : ''}
                    {formatCurrency(diferencia)}
                  </span>
                </div>
              )}

              <hr />

              <div className="caja-confirmacion-row">
                <span>Dejado para Siguiente:</span>
                <span>{formatCurrency(parseFloat(montoDejado) || 0)}</span>
              </div>
              <div className="caja-confirmacion-row caja-confirmacion-total">
                <span>Monto a Retirar:</span>
                <span className="caja-retirar-total">{formatCurrency(montoRetirar)}</span>
              </div>
            </div>

            <div className="alerta-info">
              Al confirmar, se cerrará esta caja y se creará automáticamente una nueva
              caja con {formatCurrency(parseFloat(montoDejado) || 0)} como monto inicial.
            </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="modal-actions">
          {activeStep > 0 && (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={loading}
            >
              Atrás
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            loading={loading}
            disabled={cargandoDatos}
          >
            {activeStep === STEPS.length - 1 ? 'Confirmar Cierre' : 'Continuar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
