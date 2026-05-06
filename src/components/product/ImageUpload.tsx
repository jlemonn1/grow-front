import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { ImageCropModal } from './index';
import { uploadImage } from '@/services/images.service';
import { buildResourceUrl } from '@/utils/apiUrl';
import { useUI } from '@/context/ui.context';
import { HiCamera, HiPhotograph } from 'react-icons/hi';
import './ImageUpload.css';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onError?: (error: string) => void;
  'data-tour'?: string;
}

export function ImageUpload({ value, onChange, onError, 'data-tour': dataTour }: ImageUploadProps) {
  const { showToast } = useUI();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);
  
  // Estados para el modal de recorte
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Validar archivo antes de abrir el modal de recorte
  const validateAndPrepareFile = useCallback((file: File | null): boolean => {
    if (!file) return false;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Por favor selecciona un archivo de imagen válido';
      showToast(errorMsg, 'error');
      onError?.(errorMsg);
      return false;
    }

    // Validar tamaño (20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      const errorMsg = 'La imagen es demasiado grande. El tamaño máximo es 20MB';
      showToast(errorMsg, 'error');
      onError?.(errorMsg);
      return false;
    }

    return true;
  }, [showToast, onError]);

  // Abrir modal de recorte con la imagen seleccionada
  const openCropModal = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImage(imageDataUrl);
      setSelectedFileName(file.name);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // Manejar selección de archivo (ahora abre el modal de recorte)
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    
    if (validateAndPrepareFile(file)) {
      openCropModal(file);
    }
  }, [validateAndPrepareFile, openCropModal]);

  // Manejar recorte completado - subir imagen recortada
  const handleCropComplete = useCallback(async (croppedFile: File) => {
    console.log('=== UPLOAD DEBUG ===');
    console.log('Received croppedFile:', croppedFile);
    console.log('File size:', croppedFile.size, 'bytes');
    console.log('File type:', croppedFile.type);
    console.log('File name:', croppedFile.name);
    
    setShowCropModal(false);
    setUploading(true);
    
    // Crear preview local inmediatamente
    const objectUrl = URL.createObjectURL(croppedFile);
    console.log('Created object URL:', objectUrl);
    setPreview(objectUrl);
    
    // Verificar que el object URL funciona
    const testImg = new Image();
    testImg.onload = () => {
      console.log('Object URL image loaded successfully:', testImg.width, 'x', testImg.height);
    };
    testImg.onerror = (e) => {
      console.error('Object URL image failed to load:', e);
    };
    testImg.src = objectUrl;
    
    try {
      const response = await uploadImage(croppedFile);
      console.log('Upload response:', response);
      // Liberar el objectUrl y usar la URL del servidor
      URL.revokeObjectURL(objectUrl);
      onChange(response.url);
      setPreview(response.url);
      showToast('Imagen subida exitosamente', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al subir la imagen';
      showToast(errorMsg, 'error');
      onError?.(errorMsg);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    } finally {
      setUploading(false);
      // Limpiar estados del modal
      setSelectedImage('');
      setSelectedFileName('');
      console.log('==================');
    }
  }, [onChange, onError, showToast]);

  // Cerrar modal de recorte
  const handleCloseCropModal = useCallback(() => {
    setShowCropModal(false);
    setSelectedImage('');
    setSelectedFileName('');
    // Limpiar inputs para permitir seleccionar la misma imagen de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, []);

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
    // No reseteamos aquí porque el modal necesita el input
    // Se resetea al cerrar el modal o completar el recorte
  };

  const handleRemove = () => {
    // Liberar objectUrl si existe
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
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

  // Sincronizar preview con value externo (solo cuando no estamos subiendo)
  useEffect(() => {
    if (!uploading) {
      if (value) {
        setPreview(value);
      } else if (!value && preview) {
        setPreview(null);
      }
    }
  }, [value, uploading]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  return (
    <div className="image-upload" data-tour={dataTour}>
      <div
        className="image-upload-preview-container"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className={`image-upload-preview ${dragOver ? 'image-upload-drag-over' : ''}`}>
            <img src={buildResourceUrl(preview)} alt="Preview" />
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

      {/* Modal de Recorte */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={selectedImage}
        onClose={handleCloseCropModal}
        onCropComplete={handleCropComplete}
        originalFileName={selectedFileName}
      />
    </div>
  );
}
