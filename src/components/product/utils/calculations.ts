import { Point, ImageDimensions } from '../types';

export const calculateInitialZoom = (
  imgWidth: number,
  cropSize: number,
  maxZoom: number
): number => {
  const zoom = cropSize / imgWidth;
  return Math.min(Math.max(zoom, 0.1), maxZoom);
};

export const calculateCenteredCrop = (
  dimensions: ImageDimensions,
  zoom: number,
  cropSize: number
): Point => {
  const scaledWidth = dimensions.width * zoom;
  const scaledHeight = dimensions.height * zoom;

  let x = 0;
  let y = 0;

  if (scaledWidth > cropSize) {
    x = (scaledWidth - cropSize) / 2 / zoom;
  }

  if (scaledHeight > cropSize) {
    y = (scaledHeight - cropSize) / 2 / zoom;
  }

  return { x, y };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
