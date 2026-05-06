import { useState, useEffect, useRef, RefObject } from 'react';
import { Point, ImageDimensions } from '../types';
import { calculateInitialZoom, calculateCenteredCrop } from '../utils/calculations';

const MAX_ZOOM = 3;

export const useInitialCrop = (
  dimensions: ImageDimensions | null,
  containerRef: RefObject<HTMLElement>
) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!dimensions || !containerRef.current || isInitialized.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const cropSize = Math.min(containerWidth, containerHeight);

    const initialZoom = calculateInitialZoom(dimensions.width, cropSize, MAX_ZOOM);
    const centeredCrop = calculateCenteredCrop(dimensions, initialZoom, cropSize);

    setMinZoom(initialZoom);
    setZoom(initialZoom);
    setCrop(centeredCrop);
    isInitialized.current = true;
  }, [dimensions, containerRef]);

  const resetCrop = () => {
    if (!dimensions || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const cropSize = Math.min(containerWidth, containerHeight);

    const initialZoom = calculateInitialZoom(dimensions.width, cropSize, MAX_ZOOM);
    const centeredCrop = calculateCenteredCrop(dimensions, initialZoom, cropSize);

    setZoom(initialZoom);
    setCrop(centeredCrop);
  };

  return { crop, zoom, minZoom, setCrop, setZoom, resetCrop, MAX_ZOOM };
};
