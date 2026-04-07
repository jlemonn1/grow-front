import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Spinner } from './Spinner';
import { useUI } from '@/context/ui.context';
import { customersService } from '@/services/customers.service';
import type { Customer } from '@/types/models';
import './QRScannerModal.css';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerFound: (customer: Customer) => void;
}

export function QRScannerModal({ isOpen, onClose, onCustomerFound }: QRScannerModalProps) {
  const { showToast } = useUI();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);
  const scanAreaId = useRef(`qr-scanner-${Math.random().toString(36).substr(2, 9)}`);

  // Extraer PIN del formato estructurado
  const extractPinFromQR = (qrText: string): string | null => {
    const match = qrText.match(/^CUSTOMER_PIN:(.+)$/);
    return match ? match[1] : null;
  };

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) {
      return;
    }

    const scanner = scannerRef.current;
    scannerRef.current = null;
    setIsScanning(false);

    try {
      if (scanner && typeof scanner.stop === 'function') {
        try {
          await scanner.stop();
        } catch (stopErr: any) {
          // Ignorar todos los errores al detener
        }
      }
    } catch (err) {
      // Ignorar todos los errores
    }
  }, []);

  // Buscar cliente por PIN
  const handleQRScan = useCallback(async (pin: string) => {
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      const response = await customersService.search({ q: pin, page: 0, size: 10 });
      const customers = response.content;
      
      const customer = customers.find(c => c.pin.toUpperCase() === pin.toUpperCase());
      
      if (customer) {
        await stopScanning();
        onCustomerFound(customer);
        onClose();
        showToast('Socio encontrado', 'success');
      } else {
        setError('Socio no encontrado');
        showToast('Socio no encontrado con el PIN escaneado', 'error');
      }
    } catch (err) {
      setError('Error al buscar socio');
      showToast('Error al buscar socio. Intente nuevamente.', 'error');
    } finally {
      isProcessingRef.current = false;
    }
  }, [onCustomerFound, onClose, showToast, stopScanning]);

  const startScanning = useCallback(async () => {
    if (scannerRef.current || !isOpen) {
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode(scanAreaId.current);
      scannerRef.current = html5QrCode;

      setIsScanning(true);
      setError(null);
      isProcessingRef.current = false;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            return { width: viewfinderWidth, height: viewfinderHeight };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (isProcessingRef.current) {
            return;
          }

          const pin = extractPinFromQR(decodedText);
          
          const isValidPin = (code: string): boolean => {
            if (code.length < 2 || code.length > 8) return false;
            if (!/^[0-9A-Za-z]+$/.test(code)) return false;
            // Debe tener al menos una letra
            return /[a-zA-Z]/.test(code);
          };
          
          if (pin) {
            if (isValidPin(pin)) {
              handleQRScan(pin);
            } else {
              setError('Formato de PIN inválido');
              showToast('El QR escaneado no tiene un formato válido', 'error');
            }
          } else {
            if (isValidPin(decodedText)) {
              handleQRScan(decodedText);
            } else {
              setError('Formato de QR inválido');
              showToast('El QR escaneado no es un código de socio válido', 'error');
            }
          }
        },
        (_errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      );
    } catch (err) {
      console.error('Error al iniciar escáner:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
      showToast('Error al acceder a la cámara. Verifica los permisos.', 'error');
    }
  }, [isOpen, handleQRScan, showToast]);

  // Iniciar/detener escáner cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body y html cuando el modal está abierto
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyMargin = document.body.style.margin;
      const originalBodyPadding = document.body.style.padding;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlMargin = document.documentElement.style.margin;
      const originalHtmlPadding = document.documentElement.style.padding;
      
      // Agregar clase para estilos CSS
      document.body.classList.add('qr-scanner-open');
      document.documentElement.classList.add('qr-scanner-open');
      
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      
      return () => {
        clearTimeout(timer);
        stopScanning();
        // Remover clase
        document.body.classList.remove('qr-scanner-open');
        document.documentElement.classList.remove('qr-scanner-open');
        // Restaurar estilos originales
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.margin = originalBodyMargin;
        document.body.style.padding = originalBodyPadding;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.margin = originalHtmlMargin;
        document.documentElement.style.padding = originalHtmlPadding;
      };
    } else {
      stopScanning();
      setError(null);
      isProcessingRef.current = false;
      document.body.classList.remove('qr-scanner-open');
      document.documentElement.classList.remove('qr-scanner-open');
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    }
  }, [isOpen, startScanning, stopScanning]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopScanning();
      setError(null);
      isProcessingRef.current = false;
    };
  }, [stopScanning]);

  const handleClose = () => {
    stopScanning();
    setError(null);
    isProcessingRef.current = false;
    onClose();
  };

  if (!isOpen) return null;

  // Renderizar usando portal directamente en body
  return createPortal(
    <div className="qr-scanner-fullscreen" onClick={handleClose}>
      <div className="qr-scanner-fullscreen-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-scanner-fullscreen-header">
          <h2 className="qr-scanner-fullscreen-title">Escanear Código QR</h2>
          <button
            type="button"
            className="qr-scanner-fullscreen-close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="qr-scanner-fullscreen-body">
          <p className="qr-scanner-fullscreen-instructions">
            Apunta la cámara hacia el código QR del socio para buscarlo automáticamente.
          </p>

          <div className="qr-scanner-fullscreen-container">
            <div id={scanAreaId.current} className="qr-scanner-fullscreen-area"></div>
            
            {!isScanning && !error && (
              <div className="qr-scanner-fullscreen-placeholder">
                <Spinner size="lg" />
                <p>Iniciando cámara...</p>
              </div>
            )}

            {error && (
              <div className="qr-scanner-fullscreen-error">
                <p>{error}</p>
                <button
                  type="button"
                  className="qr-scanner-fullscreen-retry"
                  onClick={() => {
                    setError(null);
                    startScanning();
                  }}
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          <div className="qr-scanner-fullscreen-actions">
            <button
              type="button"
              className="qr-scanner-fullscreen-close-button"
              onClick={handleClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}