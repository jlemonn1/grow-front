import { useCallback, useState } from 'react';
import { Area } from '../types';

export const useCropImage = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createCroppedImage = useCallback(async (
    imageSrc: string,
    croppedAreaPixels: Area,
    rotation: number,
    originalFileName: string
  ): Promise<File | null> => {
    setIsProcessing(true);

    try {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('No context');

      const size = Math.min(croppedAreaPixels.width, croppedAreaPixels.height);
      canvas.width = size;
      canvas.height = size;

      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-size / 2, size / 2);

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
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { createCroppedImage, isProcessing };
};

const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
};
