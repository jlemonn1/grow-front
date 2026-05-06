export interface Point {
  x: number;
  y: number;
}

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropState {
  crop: Point;
  zoom: number;
  minZoom: number;
  rotation: number;
}

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  originalFileName: string;
}
