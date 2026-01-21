import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { Spinner } from '@/components/common/Spinner';
import { ImageUpload } from '@/components/product/ImageUpload';
import { useConfig } from '@/context/config.context';
import { useUI } from '@/context/ui.context';
import type { UpdateGrowConfigurationRequest } from '@/services/config.service';
import type { ValidationError } from '@/types/api';
import { generateColorPalette } from '@/utils/colorSystem';
import './ConfigPage.css';

export function ConfigPage() {
  const { config, loading, updateConfiguration } = useConfig();
  const { showToast } = useUI();

  const [formData, setFormData] = useState<UpdateGrowConfigurationRequest>({
    growName: '',
    logoUrl: null,
    primaryColor: '#3bd420',
    showCashDetails: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar configuración cuando esté disponible
  useEffect(() => {
    if (config) {
      setFormData({
        growName: config.growName,
        logoUrl: config.logoUrl,
        primaryColor: config.primaryColor,
        showCashDetails: config.showCashDetails,
      });
      setHasChanges(false);
    }
  }, [config]);

  const handleChange = useCallback((field: keyof UpdateGrowConfigurationRequest, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!formData.growName.trim()) {
      newErrors.growName = 'El nombre de la grow es obligatorio';
    }
    if (!formData.primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.primaryColor = 'El color debe estar en formato hexadecimal (#RRGGBB)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateConfiguration(formData);
      showToast('Configuración guardada exitosamente', 'success');
      setHasChanges(false);
    } catch (error) {
      if ((error as ValidationError).fieldErrors) {
        const fieldErrors = (error as ValidationError).fieldErrors || {};
        const errorsMap: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          if (fieldErrors[key] && fieldErrors[key].length > 0) {
            errorsMap[key] = fieldErrors[key][0];
          }
        });
        setErrors(errorsMap);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error al guardar configuración';
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, updateConfiguration, showToast]);

  // Generar paleta de colores para previsualización
  const colorPalette = generateColorPalette(formData.primaryColor);

  if (loading) {
    return (
      <div className="config-page">
        <PageHeader title="Configuración" />
        <div className="config-page-loading">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <PageHeader title="Configuración" />
      
      <form onSubmit={handleSubmit}>
        <FormCard>
          <FormSection title="Identidad">
            <Input
              label="Nombre de la grow"
              value={formData.growName}
              onChange={(e) => handleChange('growName', e.target.value)}
              error={errors.growName}
              required
              id="growName"
            />

            <div className="form-field">
              <label className="form-label">Logo</label>
              <ImageUpload
                value={formData.logoUrl || undefined}
                onChange={(url) => handleChange('logoUrl', url || null)}
              />
            </div>
          </FormSection>

          <FormSection title="Apariencia">
            <div className="form-field">
              <label htmlFor="primaryColor" className="form-label">
                Color principal
              </label>
              <div className="config-color-selector">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="config-color-input"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  error={errors.primaryColor}
                  placeholder="#3bd420"
                  required
                  id="primaryColorHex"
                />
              </div>
              <p className="config-color-info">
                El color se guardará y estará disponible para personalización futura.
              </p>
              
              {/* Previsualización de paleta */}
              <div className="config-color-preview">
                <h4>Vista previa de colores generados:</h4>
                <div className="config-color-swatches">
                  <div className="config-color-swatch">
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primary }}
                    />
                    <span>Principal</span>
                  </div>
                  <div className="config-color-swatch">
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primaryLight }}
                    />
                    <span>Claro</span>
                  </div>
                  <div className="config-color-swatch">
                    <div 
                      className="config-color-swatch-color" 
                      style={{ backgroundColor: colorPalette.primaryDark }}
                    />
                    <span>Oscuro</span>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Privacidad y visualización">
            <div className="form-field">
              <label className="form-label">
                Mostrar detalles de efectivo en las ventas
              </label>
              <div className="config-toggle">
                <button
                  type="button"
                  className={`config-toggle-button ${formData.showCashDetails ? 'active' : ''}`}
                  onClick={() => handleChange('showCashDetails', !formData.showCashDetails)}
                >
                  <span className="config-toggle-slider" />
                </button>
                <span className="config-toggle-label">
                  {formData.showCashDetails ? 'Mostrar' : 'Ocultar'} dinero entregado y cambio
                </span>
              </div>
              <p className="config-toggle-description">
                Cuando está desactivado, solo se muestra el total de la venta. 
                El efectivo recibido y el cambio quedan ocultos en la UI, tickets y reportes.
              </p>
            </div>
          </FormSection>

          <div className="config-actions">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!hasChanges}
            >
              Guardar cambios
            </Button>
          </div>
        </FormCard>
      </form>
    </div>
  );
}
