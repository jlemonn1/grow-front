import { useState, useEffect } from 'react';
import { generateLogoSVG, type LogoStyle } from '@/utils/logoGenerator';
import { svgToDataURL } from '@/utils/svgToImage';
import { uploadImage } from '@/services/images.service';
import { buildResourceUrl } from '@/utils/apiUrl';
import { useUI } from '@/context/ui.context';
import { Spinner } from '@/components/common/Spinner';
import { HiUpload } from 'react-icons/hi';
import './LogoSelector.css';

export type LogoOption = 
  | { type: 'predefined'; style: LogoStyle; variant: 1 | 2 }
  | { type: 'custom'; url: string };

interface LogoSelectorProps {
  growName: string;
  selectedLogo: LogoOption | null;
  onSelectLogo: (logo: LogoOption) => void;
}

export function LogoSelector({ growName, selectedLogo, onSelectLogo }: LogoSelectorProps) {
  const { showToast } = useUI();
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Generar previews de los logos predefinidos
  useEffect(() => {
    const generatePreviews = async () => {
      if (!growName.trim()) {
        setLoadingPreviews(false);
        return;
      }

      const previews: Record<string, string> = {};
      const styles: Array<{ style: LogoStyle; variant: 1 | 2; key: string }> = [
        { style: 'graffiti', variant: 1, key: 'graffiti-1' },
        { style: 'graffiti', variant: 2, key: 'graffiti-2' },
        { style: 'retro', variant: 1, key: 'retro-1' },
        { style: 'retro', variant: 2, key: 'retro-2' },
      ];

      try {
        for (const { style, variant, key } of styles) {
          const svg = generateLogoSVG(style, variant, growName || 'Growshop');
          const dataURL = await svgToDataURL(svg, 400, 400);
          previews[key] = dataURL;
        }
        setPreviewUrls(previews);
      } catch (error) {
        console.error('Error generando previews:', error);
        showToast('Error al generar previews de logos', 'error');
      } finally {
        setLoadingPreviews(false);
      }
    };

    generatePreviews();
  }, [growName, showToast]);

  const handlePredefinedSelect = (style: LogoStyle, variant: 1 | 2) => {
    onSelectLogo({ type: 'predefined', style, variant });
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido', 'error');
      return;
    }

    // Validar tamaño (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('La imagen es demasiado grande. El tamaño máximo es 20MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadImage(file);
      onSelectLogo({ type: 'custom', url: response.url });
      showToast('Logo subido exitosamente', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const getLogoPreview = (logo: LogoOption | null): string | null => {
    if (!logo) return null;
    
    if (logo.type === 'custom') {
      return buildResourceUrl(logo.url);
    }
    
    const key = `${logo.style}-${logo.variant}`;
    return previewUrls[key] || null;
  };

  const getLogoLabel = (style: LogoStyle, variant: 1 | 2): string => {
    if (style === 'graffiti') {
      return variant === 1 ? 'Grafiti - Hoja' : 'Grafiti - Mono';
    } else {
      return variant === 1 ? 'Retro - Planta' : 'Retro - Símbolo';
    }
  };

  const selectedPreview = getLogoPreview(selectedLogo);

  return (
    <div className="logo-selector">
      <div className="logo-selector-grid">
        {/* Logo Grafiti 1 */}
        <button
          type="button"
          className={`logo-selector-option ${
            selectedLogo?.type === 'predefined' &&
            selectedLogo.style === 'graffiti' &&
            selectedLogo.variant === 1
              ? 'selected'
              : ''
          }`}
          onClick={() => handlePredefinedSelect('graffiti', 1)}
          disabled={loadingPreviews || !growName.trim()}
        >
          {loadingPreviews ? (
            <div className="logo-selector-loading">
              <Spinner size="sm" />
            </div>
          ) : previewUrls['graffiti-1'] ? (
            <img src={previewUrls['graffiti-1']} alt="Grafiti - Hoja" />
          ) : (
            <div className="logo-selector-placeholder">Grafiti</div>
          )}
          <span className="logo-selector-label">{getLogoLabel('graffiti', 1)}</span>
        </button>

        {/* Logo Grafiti 2 */}
        <button
          type="button"
          className={`logo-selector-option ${
            selectedLogo?.type === 'predefined' &&
            selectedLogo.style === 'graffiti' &&
            selectedLogo.variant === 2
              ? 'selected'
              : ''
          }`}
          onClick={() => handlePredefinedSelect('graffiti', 2)}
          disabled={loadingPreviews || !growName.trim()}
        >
          {loadingPreviews ? (
            <div className="logo-selector-loading">
              <Spinner size="sm" />
            </div>
          ) : previewUrls['graffiti-2'] ? (
            <img src={previewUrls['graffiti-2']} alt="Grafiti - Mono" />
          ) : (
            <div className="logo-selector-placeholder">Grafiti</div>
          )}
          <span className="logo-selector-label">{getLogoLabel('graffiti', 2)}</span>
        </button>

        {/* Logo Retro 1 */}
        <button
          type="button"
          className={`logo-selector-option ${
            selectedLogo?.type === 'predefined' &&
            selectedLogo.style === 'retro' &&
            selectedLogo.variant === 1
              ? 'selected'
              : ''
          }`}
          onClick={() => handlePredefinedSelect('retro', 1)}
          disabled={loadingPreviews || !growName.trim()}
        >
          {loadingPreviews ? (
            <div className="logo-selector-loading">
              <Spinner size="sm" />
            </div>
          ) : previewUrls['retro-1'] ? (
            <img src={previewUrls['retro-1']} alt="Retro - Planta" />
          ) : (
            <div className="logo-selector-placeholder">Retro</div>
          )}
          <span className="logo-selector-label">{getLogoLabel('retro', 1)}</span>
        </button>

        {/* Logo Retro 2 */}
        <button
          type="button"
          className={`logo-selector-option ${
            selectedLogo?.type === 'predefined' &&
            selectedLogo.style === 'retro' &&
            selectedLogo.variant === 2
              ? 'selected'
              : ''
          }`}
          onClick={() => handlePredefinedSelect('retro', 2)}
          disabled={loadingPreviews || !growName.trim()}
        >
          {loadingPreviews ? (
            <div className="logo-selector-loading">
              <Spinner size="sm" />
            </div>
          ) : previewUrls['retro-2'] ? (
            <img src={previewUrls['retro-2']} alt="Retro - Símbolo" />
          ) : (
            <div className="logo-selector-placeholder">Retro</div>
          )}
          <span className="logo-selector-label">{getLogoLabel('retro', 2)}</span>
        </button>

      </div>
      
      {/* Opción de subir logo personalizado - en capa separada */}
      <div className="logo-selector-custom-wrapper">
        <button
          type="button"
          className={`logo-selector-custom-button ${
            selectedLogo?.type === 'custom' ? 'selected' : ''
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0] || null;
              handleFileSelect(file);
            };
            input.click();
          }}
          disabled={uploading}
        >
          {uploading ? (
            <div className="logo-selector-custom-loading">
              <Spinner size="sm" />
            </div>
          ) : selectedPreview && selectedLogo?.type === 'custom' ? (
            <div className="logo-selector-custom-preview">
              <img src={selectedPreview} alt="Logo personalizado" />
            </div>
          ) : (
            <div className="logo-selector-custom-placeholder">
              <HiUpload size={20} />
              <span>Subir logo personalizado</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
