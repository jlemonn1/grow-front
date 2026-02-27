import { useState } from 'react';
import { HiCube } from 'react-icons/hi';
import { buildResourceUrl } from '@/utils/apiUrl';
import './ProductImage.css';

interface ProductImageProps {
  imageUrl: string | null | undefined;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ProductImage({ 
  imageUrl, 
  alt = 'Producto', 
  size = 'small',
  className = '' 
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Si no hay URL de imagen, mostrar placeholder
  if (!imageUrl) {
    return (
      <div className={`product-image product-image-${size} product-image-placeholder ${className}`}>
        <span className="product-image-placeholder-icon"><HiCube /></span>
      </div>
    );
  }

  // Construir URL completa si es relativa
  const fullImageUrl = buildResourceUrl(imageUrl);

  if (imageError) {
    return (
      <div className={`product-image product-image-${size} product-image-placeholder ${className}`}>
        <span className="product-image-placeholder-icon"><HiCube /></span>
      </div>
    );
  }

  return (
    <div className={`product-image product-image-${size} ${className}`}>
      {imageLoading && (
        <div className="product-image-loading">
          <div className="product-image-loading-spinner"></div>
        </div>
      )}
      <img
        src={fullImageUrl}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
        className={imageLoading ? 'product-image-hidden' : ''}
      />
    </div>
  );
}
