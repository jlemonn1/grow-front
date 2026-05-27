import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { HiCamera, HiRefresh, HiCheck } from 'react-icons/hi';
import './FullScreenCameraModal.css';

interface FullScreenCameraModalProps {
  isOpen: boolean;
  customerName: string;
  onCapture: (file: File) => void;
  onClose: () => void;
  isUploading?: boolean;
}

export function FullScreenCameraModal({
  isOpen,
  customerName,
  onCapture,
  onClose,
  isUploading = false,
}: FullScreenCameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    setPhoto(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err) {
      console.error('Error accessing camera:', err);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        streamRef.current = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
        setIsInitializing(false);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError(
          'No se pudo acceder a la cámara. Por favor verifica los permisos.'
        );
        setIsInitializing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setPhoto(null);
      setCapturedPhotoBlob(null);
      setError(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedPhotoBlob(blob);
          setPhoto(canvas.toDataURL('image/jpeg'));
          stopStream();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const retakePhoto = () => {
    setPhoto(null);
    setCapturedPhotoBlob(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!capturedPhotoBlob) return;

    const file = new File([capturedPhotoBlob], `camera-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    onCapture(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fullscreen-camera-overlay">
      <div className="fullscreen-camera-content">
        <div className="fullscreen-camera-header">
          <h2 className="fullscreen-camera-title">
            Foto obligatoria: {customerName}
          </h2>
          <p className="fullscreen-camera-subtitle">
            Este socio no tiene foto de perfil. Tómale una foto para continuar.
          </p>
        </div>

        <div className="fullscreen-camera-body">
          {error && (
            <div className="fullscreen-camera-error">
              <p>{error}</p>
              <Button variant="secondary" onClick={startCamera} icon={<HiRefresh />}>
                Reintentar
              </Button>
            </div>
          )}

          {!error && !photo && (
            <>
              <div className="fullscreen-camera-video-wrapper">
                {isInitializing && (
                  <div className="fullscreen-camera-loading">
                    <p>Inicializando cámara...</p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="fullscreen-camera-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <div className="fullscreen-camera-controls">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isUploading}
                  className="fullscreen-camera-close-btn"
                >
                  Cerrar
                </Button>
                <Button
                  variant="primary"
                  onClick={capturePhoto}
                  icon={<HiCamera />}
                  disabled={isInitializing || !stream || isUploading}
                  className="fullscreen-camera-capture-btn"
                >
                  {isUploading ? 'Subiendo...' : 'Capturar'}
                </Button>
              </div>
            </>
          )}

          {photo && (
            <>
              <div className="fullscreen-camera-photo-wrapper">
                <img
                  src={photo}
                  alt="Foto capturada"
                  className="fullscreen-camera-photo"
                />
              </div>

              <div className="fullscreen-camera-controls">
                <Button
                  variant="secondary"
                  onClick={retakePhoto}
                  icon={<HiRefresh />}
                  disabled={isUploading}
                >
                  Repetir
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmPhoto}
                  icon={<HiCheck />}
                  disabled={isUploading}
                >
                  {isUploading ? 'Subiendo...' : 'Usar foto'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
