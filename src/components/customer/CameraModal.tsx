import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { HiCamera, HiRefresh, HiX, HiCheck } from 'react-icons/hi';
import './CameraModal.css';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}

export function CameraModal({ isOpen, onClose, onCapture, title = 'Capturar foto' }: CameraModalProps) {
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
      streamRef.current.getTracks().forEach(track => track.stop());
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
          height: { ideal: 1080 }
        },
        audio: false
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
          audio: false
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
        setError('No se pudo acceder a la cámara. Por favor verifica los permisos.');
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

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedPhotoBlob(blob);
        setPhoto(canvas.toDataURL('image/jpeg'));
        stopStream();
      }
    }, 'image/jpeg', 0.9);
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
      lastModified: Date.now()
    });
    onCapture(file);
    onClose();
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="camera-modal-container">
        {error && (
          <div className="camera-error">
            <p>{error}</p>
            <Button variant="secondary" onClick={startCamera} icon={<HiRefresh />}>
              Reintentar
            </Button>
          </div>
        )}

        {!error && !photo && (
          <>
            <div className="camera-video-container">
              {isInitializing && (
                <div className="camera-loading">
                  <p>Inicializando cámara...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="camera-controls">
              <Button
                variant="secondary"
                onClick={handleClose}
                icon={<HiX />}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={capturePhoto}
                icon={<HiCamera />}
                disabled={isInitializing || !stream}
              >
                Capturar
              </Button>
            </div>
          </>
        )}

        {photo && (
          <>
            <div className="camera-photo-container">
              <img src={photo} alt="Foto capturada" className="camera-photo" />
            </div>

            <div className="camera-controls">
              <Button
                variant="secondary"
                onClick={retakePhoto}
                icon={<HiRefresh />}
              >
                Repetir
              </Button>
              <Button
                variant="primary"
                onClick={confirmPhoto}
                icon={<HiCheck />}
              >
                Usar foto
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
