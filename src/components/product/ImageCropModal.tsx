import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { HiCheck, HiX, HiRefresh, HiPlus, HiMinus } from 'react-icons/hi';
import { Point, Area } from './types';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  originalFileName: string;
}

const MAX_ZOOM = 5;
const MIN_ZOOM = 0.1;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  originalFileName,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom] = useState(MIN_ZOOM);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState(300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar dimensiones de la imagen
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Calcular tamaño del contenedor
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      setContainerSize(size);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Calcular zoom inicial cuando tenemos imagen y contenedor
  useEffect(() => {
    if (!imageSize || containerSize === 0) return;

    const maxImageDimension = Math.max(imageSize.width, imageSize.height);
    const initialZoom = containerSize / maxImageDimension;
    const clampedZoom = Math.min(Math.max(initialZoom, MIN_ZOOM), MAX_ZOOM);
    
    setZoom(clampedZoom);
    setCrop({ x: 0, y: 0 });
  }, [imageSize, containerSize]);

  // Cuando el cropper termina de calcular, guardamos las coordenadas
  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    console.log('Cropper areaPixels:', areaPixels);
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    if (!imageSize || containerSize === 0) return;

    const maxImageDimension = Math.max(imageSize.width, imageSize.height);
    const initialZoom = containerSize / maxImageDimension;
    const clampedZoom = Math.min(Math.max(initialZoom, MIN_ZOOM), MAX_ZOOM);
    
    setZoom(clampedZoom);
    setCrop({ x: 0, y: 0 });
    setRotation(0);
  }, [imageSize, containerSize]);

  // Wheel zoom
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(prev + delta, minZoom), MAX_ZOOM));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isOpen, minZoom]);

  const createCroppedImage = useCallback(async (): Promise<File | null> => {
    console.log('=== CROP DEBUG ===');
    console.log('croppedAreaPixels:', croppedAreaPixels);
    
    if (!croppedAreaPixels || !imageSrc) {
      console.error('Missing croppedAreaPixels or imageSrc');
      return null;
    }

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', reject);
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = imageSrc;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('No context');

      // El tamaño del canvas es el tamaño del área recortada
      const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
      canvas.width = size;
      canvas.height = size;

      console.log('Drawing image at:', croppedAreaPixels.x, croppedAreaPixels.y, 
                  'size:', croppedAreaPixels.width, croppedAreaPixels.height);

      // Dibujar la porción recortada de la imagen original
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        size,
        size
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
      });

      if (!blob) throw new Error('No blob');

      return new File([blob], originalFileName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }, [croppedAreaPixels, imageSrc, originalFileName]);

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    try {
      const file = await createCroppedImage();
      if (file) {
        onCropComplete(file);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [createCroppedImage, onCropComplete]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setImageSize(null);
      setCroppedAreaPixels(null);
      onClose();
    }
  }, [isProcessing, onClose]);

  const canReset = zoom !== (imageSize && containerSize ? Math.min(Math.max(containerSize / Math.max(imageSize.width, imageSize.height), MIN_ZOOM), MAX_ZOOM) : 1) || crop.x !== 0 || crop.y !== 0 || rotation !== 0;

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.btnIcon}
          onClick={handleClose}
          disabled={isProcessing}
          aria-label="Cancelar"
        >
          <HiX />
        </button>

        <h2 className={styles.title}>Recortar Imagen</h2>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnIcon}
            onClick={handleReset}
            disabled={isProcessing || !canReset}
            aria-label="Resetear"
            title="Resetear"
          >
            <HiRefresh />
          </button>

          <button
            type="button"
            className={`${styles.btnIcon} ${styles.btnConfirm}`}
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
            aria-label="Confirmar"
          >
            {isProcessing ? <Spinner size="sm" /> : <HiCheck />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Crop Area */}
        <div ref={containerRef} className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            minZoom={minZoom}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
            restrictPosition={false}
            style={{
              containerStyle: { background: 'transparent' },
              mediaStyle: { cursor: 'grab' },
              cropAreaStyle: { border: 'none', boxShadow: 'none' },
            }}
          />
        </div>

        {/* Zoom Sidebar */}
        <div className={styles.zoomSidebar}>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => setZoom(Math.min(zoom + 0.1, MAX_ZOOM))}
            disabled={isProcessing || zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <HiPlus />
          </button>
          
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className={styles.zoomSlider}
              disabled={isProcessing}
              aria-label="Ajustar zoom"
            />
          </div>
          
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => setZoom(Math.max(zoom - 0.1, MIN_ZOOM))}
            disabled={isProcessing || zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <HiMinus />
          </button>
          
          <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={handleRotate}
          disabled={isProcessing}
          icon={<HiRefresh />}
        >
          Rotar
        </Button>
      </div>
    </div>
    </div>
  );
};
