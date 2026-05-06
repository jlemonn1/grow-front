import { useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from '../types';
import styles from '../ImageCropModal.module.css';

interface CropAreaProps {
  imageSrc: string;
  crop: Point;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  rotation: number;
  onCropChange: (location: Point) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onZoomChange: (zoom: number) => void;
}

export const CropArea: React.FC<CropAreaProps> = ({
  imageSrc,
  crop,
  zoom,
  minZoom,
  maxZoom,
  rotation,
  onCropChange,
  onCropComplete,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      onZoomChange(Math.min(Math.max(zoom + delta, minZoom), maxZoom));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, minZoom, maxZoom, onZoomChange]);

  return (
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
        maxZoom={maxZoom}
        onCropChange={onCropChange}
        onCropComplete={onCropComplete}
        onZoomChange={onZoomChange}
        restrictPosition={false}
        style={{
          containerStyle: { background: 'transparent' },
          mediaStyle: { cursor: 'grab' },
          cropAreaStyle: { border: 'none', boxShadow: 'none' },
        }}
      />
    </div>
  );
};
