import { useState, useEffect } from 'react';
import { ImageDimensions } from '../types';

export const useImageDimensions = (imageSrc: string, isOpen: boolean) => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setDimensions(null);
      return;
    }

    setIsLoading(true);
    const img = new Image();

    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  return { dimensions, isLoading };
};
