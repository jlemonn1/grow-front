import { useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useConfig } from '@/context/config.context';
import { buildResourceUrl } from '@/utils/apiUrl';
import type { Customer } from '@/types/models';
import './QRCodeModal.css';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

/**
 * Obtiene la URL completa del logo
 */
function getLogoUrl(logoUrl: string): string {
  return buildResourceUrl(logoUrl);
}

/**
 * Convierte un color hexadecimal a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 59, g: 212, b: 32 }; // Color por defecto
}

/**
 * Dibuja un rectángulo redondeado en el canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Dibuja una hoja decorativa tipo marihuana
 */
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  ctx.beginPath();
  // Forma de hoja de marihuana simplificada
  ctx.moveTo(0, -size * 0.3);
  ctx.quadraticCurveTo(-size * 0.4, -size * 0.2, -size * 0.5, size * 0.1);
  ctx.quadraticCurveTo(-size * 0.3, size * 0.3, 0, size * 0.4);
  ctx.quadraticCurveTo(size * 0.3, size * 0.3, size * 0.5, size * 0.1);
  ctx.quadraticCurveTo(size * 0.4, -size * 0.2, 0, -size * 0.3);
  ctx.closePath();
  
  ctx.restore();
}

export function QRCodeModal({ isOpen, onClose, customer }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const customQRRef = useRef<HTMLDivElement>(null);
  const { config } = useConfig();

  const qrValue = useMemo(() => {
    if (!customer?.pin) return '';
    return `CUSTOMER_PIN:${customer.pin}`;
  }, [customer?.pin]);

  const handleDownload = async () => {
    if (!customer || !customQRRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Tamaño final: 600x900px (formato 2:3)
    const finalWidth = 600;
    const finalHeight = 900;
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Fondo verde con gradiente marihuanero
    const primaryColor = config?.primaryColor || '#3bd420';
    const primaryRgb = hexToRgb(primaryColor);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, finalHeight);
    gradient.addColorStop(0, '#0d4a1a');
    gradient.addColorStop(0.3, '#1a6b2e');
    gradient.addColorStop(0.6, '#2d8f47');
    gradient.addColorStop(1, '#1a6b2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Efecto glow general del fondo
    ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`;
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillRect(0, 0, finalWidth, finalHeight);
    ctx.shadowBlur = 0;

    // Decoraciones neon marihuaneras - Hojas decorativas
    ctx.save();
    
    // Hoja decorativa superior derecha (neon)
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`;
    ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.5)`;
    ctx.shadowBlur = 20;
    drawLeaf(ctx, 480, 100, 80, -15);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Hoja decorativa inferior izquierda (neon)
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.25)`;
    ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`;
    ctx.shadowBlur = 15;
    drawLeaf(ctx, 120, 800, 70, 25);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Círculos neon decorativos
    ctx.globalAlpha = 0.1;
    const neonGradient1 = ctx.createRadialGradient(500, 50, 0, 500, 50, 150);
    neonGradient1.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`);
    neonGradient1.addColorStop(1, 'transparent');
    ctx.fillStyle = neonGradient1;
    ctx.beginPath();
    ctx.arc(500, 50, 150, 0, Math.PI * 2);
    ctx.fill();

    const neonGradient2 = ctx.createRadialGradient(100, 850, 0, 100, 850, 120);
    neonGradient2.addColorStop(0, `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`);
    neonGradient2.addColorStop(1, 'transparent');
    ctx.fillStyle = neonGradient2;
    ctx.beginPath();
    ctx.arc(100, 850, 120, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // Padding general
    const padding = 40;
    let currentY = padding;

    // 1. Logo (arriba)
    if (config?.logoUrl) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => {
            console.warn('No se pudo cargar el logo para la descarga');
            resolve(); // Continuar sin logo
          };
          logoImg.src = getLogoUrl(config.logoUrl!);
        });

        if (logoImg.complete && logoImg.naturalWidth > 0) {
          const logoSize = 120;
          const logoX = (finalWidth - logoSize) / 2;
          ctx.drawImage(logoImg, logoX, currentY, logoSize, logoSize);
          currentY += logoSize + 30;
        }
      } catch (err) {
        console.error('Error cargando logo:', err);
      }
    }

    // 2. Nombre de la grow con efecto neon
    if (config?.growName) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Efecto glow neon para el texto
      ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.8)`;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Manejar texto largo dividiéndolo en líneas
      const maxWidth = finalWidth - (padding * 2);
      const words = config.growName.split(' ');
      let line = '';
      let lineY = currentY;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, finalWidth / 2, lineY);
          line = words[i] + ' ';
          lineY += 40;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, finalWidth / 2, lineY);
      ctx.shadowBlur = 0;
      currentY = lineY + 60;
    }

    // 3. QR Code (centro) con borde decorativo
    const svg = customQRRef.current.querySelector('svg') as SVGElement;
    if (svg) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const qrImg = new Image();
        await new Promise<void>((resolve, reject) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = reject;
          qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        });

        const qrSize = 400;
        const qrPadding = 20;
        const qrX = (finalWidth - qrSize - (qrPadding * 2)) / 2;
        const qrY = currentY;

        // Fondo blanco del QR con borde neon
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.3)`;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        drawRoundedRect(ctx, qrX, qrY, qrSize + (qrPadding * 2), qrSize + (qrPadding * 2), 20);
        ctx.fill();
        
        // Borde neon decorativo
        ctx.shadowColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.4)`;
        ctx.lineWidth = 4;
        drawRoundedRect(ctx, qrX, qrY, qrSize + (qrPadding * 2), qrSize + (qrPadding * 2), 20);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Sombra interna sutil
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'transparent';
        drawRoundedRect(ctx, qrX + 2, qrY + 2, qrSize + (qrPadding * 2) - 4, qrSize + (qrPadding * 2) - 4, 18);
        ctx.fill();

        // Dibujar el QR
        ctx.shadowColor = 'transparent';
        ctx.drawImage(qrImg, qrX + qrPadding, qrY + qrPadding, qrSize, qrSize);
        
        currentY += qrSize + (qrPadding * 2) + 40;
      } catch (err) {
        console.error('Error renderizando QR:', err);
      }
    }

    // 4. Frase "Fumon" (abajo) con efecto neon intenso
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText('Fumon', finalWidth / 2, currentY);
    // Segundo glow más intenso
    ctx.shadowBlur = 30;
    ctx.fillText('Fumon', finalWidth / 2, currentY);
    ctx.shadowBlur = 0;

    // Descargar como PNG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${customer.pin}_${customer.displayName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  if (!customer) return null;

  const logoUrl = config?.logoUrl ? getLogoUrl(config.logoUrl) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Código QR del Socio">
      <div className="qr-code-modal-content">
        <div className="qr-code-modal-info">
          <p className="qr-code-modal-customer-name">
            Socio: <strong>{customer.displayName}</strong>
          </p>
          <p className="qr-code-modal-pin">
            PIN: <strong>{customer.pin}</strong>
          </p>
          <p className="qr-code-modal-description">
            Escanea este código QR para buscar rápidamente al socio en los buscadores.
          </p>
        </div>
        
        {/* QR personalizado con branding */}
        <div ref={customQRRef} className="qr-code-custom-container">
          {/* Logo */}
          {logoUrl && (
            <div className="qr-code-custom-logo">
              <img 
                src={logoUrl} 
                alt={config?.growName || 'Logo'} 
                crossOrigin="anonymous"
              />
            </div>
          )}
          
          {/* Nombre de la grow */}
          {config?.growName && (
            <div className="qr-code-custom-grow-name">
              {config.growName}
            </div>
          )}
          
          {/* QR Code */}
          <div ref={qrRef} className="qr-code-custom-qr">
            {qrValue && (
              <QRCodeSVG
                value={qrValue}
                size={400}
                level="M"
                includeMargin={true}
              />
            )}
          </div>
          
          {/* Frase Fumon */}
          <div 
            className="qr-code-custom-fumon"
            style={{ color: config?.primaryColor || '#3bd420' }}
          >
            Fumon
          </div>
        </div>

        <div className="qr-code-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleDownload}
          >
            Descargar QR
          </Button>
        </div>
      </div>
    </Modal>
  );
}