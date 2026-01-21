import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { uploadImage } from '@/services/images.service';
import { useUI } from '@/context/ui.context';
import { HiCamera, HiPhotograph } from 'react-icons/hi';
import './ImageUpload.css';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export function ImageUpload({ value, onChange, onError }: ImageUploadProps) {
  const { showToast } = useUI();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Por favor selecciona un archivo de imagen válido';
      showToast(errorMsg, 'error');
      onError?.(errorMsg);
      return;
    }

    // Validar tamaño (20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      const errorMsg = 'La imagen es demasiado grande. El tamaño máximo es 20MB';
      showToast(errorMsg, 'error');
      onError?.(errorMsg);
      return;
    }

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen
    setUploading(true);
    try {
      const response = await uploadImage(file);
      onChange(response.url);
      showToast('Imagen subida exitosamente', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al subir la imagen';
      showToast(errorMsg, 'error');
      onError?.(errorMsg);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  // Sincronizar preview con value externo
  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value);
    } else if (!value && preview) {
      setPreview(null);
    }
  }, [value, preview]);

  return (
    <div className="image-upload">
      <div
        className="image-upload-preview-container"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className={`image-upload-preview ${dragOver ? 'image-upload-drag-over' : ''}`}>
            <img src={preview.startsWith('http') ? preview : `http://localhost:8080${preview}`} alt="Preview" />
            {!uploading && (
              <button
                type="button"
                className="image-upload-remove"
                onClick={handleRemove}
                aria-label="Eliminar imagen"
              >
                ×
              </button>
            )}
            {uploading && (
              <div className="image-upload-overlay">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className={`image-upload-placeholder ${dragOver ? 'image-upload-drag-over' : ''}`}>
            {uploading ? (
              <Spinner size="sm" />
            ) : (
              <span>Sin imagen</span>
            )}
          </div>
        )}
      </div>

      <div className="image-upload-controls">
        <Button
          type="button"
          variant="secondary"
          onClick={handleGalleryClick}
          disabled={uploading}
          icon={<HiPhotograph />}
        >
          Galería
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCameraClick}
          disabled={uploading}
          icon={<HiCamera />}
        >
          Cámara
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Seleccionar imagen de galería"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Capturar imagen con cámara"
      />
    </div>
  );
}
