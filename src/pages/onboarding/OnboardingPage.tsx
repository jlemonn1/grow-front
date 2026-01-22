import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/context/config.context';
import { useUI } from '@/context/ui.context';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { LogoSelector, type LogoOption } from '@/components/onboarding/LogoSelector';
import { generateLogoSVG } from '@/utils/logoGenerator';
import { svgToFile } from '@/utils/svgToImage';
import { uploadImage } from '@/services/images.service';
import './OnboardingPage.css';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { config, loading: configLoading, updateConfiguration, needsOnboarding } = useConfig();
  const { showToast } = useUI();

  const [growName, setGrowName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<LogoOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Si no necesita onboarding, redirigir a home
  if (!configLoading && !needsOnboarding) {
    navigate('/home', { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors: Record<string, string> = {};
    
    if (!growName.trim()) {
      newErrors.growName = 'El nombre del growshop es obligatorio';
    } else if (growName.trim().length < 2) {
      newErrors.growName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!selectedLogo) {
      newErrors.logo = 'Debes seleccionar o subir un logo';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl: string | null = null;

      // Procesar el logo seleccionado
      if (selectedLogo) {
        if (selectedLogo.type === 'custom') {
          // Logo personalizado ya está subido, usar su URL
          logoUrl = selectedLogo.url;
        } else {
          // Logo predefinido: generar SVG y subirlo
          const svgString = generateLogoSVG(
            selectedLogo.style,
            selectedLogo.variant,
            growName.trim()
          );
          
          // Convertir SVG a File (ahora es 1:1, cuadrado)
          const logoFile = await svgToFile(
            svgString,
            `logo-${selectedLogo.style}-${selectedLogo.variant}.png`,
            800,
            800
          );

          // Subir al backend
          const uploadResponse = await uploadImage(logoFile);
          logoUrl = uploadResponse.url;
        }
      }

      // Actualizar configuración
      await updateConfiguration({
        growName: growName.trim(),
        logoUrl,
        primaryColor: config?.primaryColor || '#3bd420',
        showCashDetails: config?.showCashDetails ?? true,
      });

      showToast('¡Configuración completada! Bienvenido a tu growshop', 'success');
      
      // Redirigir a home después de un breve delay
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la configuración';
      showToast(errorMessage, 'error');
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (configLoading) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-loading">
          <Spinner size="lg" />
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1 className="onboarding-title">¡Bienvenido!</h1>
          <p className="onboarding-subtitle">Configura tu growshop en unos simples pasos</p>
        </div>

        <FormCard className="onboarding-form-card">
          <form onSubmit={handleSubmit} className="onboarding-form">
            {errors.submit && (
              <div className="onboarding-error">
                {errors.submit}
              </div>
            )}

            <FormSection
              title="Nombre de tu growshop"
              description="Este nombre aparecerá en tu logo y en toda la aplicación"
            >
              <Input
                label="Nombre del growshop"
                value={growName}
                onChange={(e) => {
                  setGrowName(e.target.value);
                  if (errors.growName) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.growName;
                      return newErrors;
                    });
                  }
                }}
                error={errors.growName}
                placeholder="Ej: Mi Growshop"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </FormSection>

            <FormSection
              title="Logo de tu growshop"
              description={
                !growName.trim()
                  ? "Primero ingresa el nombre para ver los logos predefinidos"
                  : "Selecciona uno de nuestros logos predefinidos o sube tu propio logo"
              }
            >
              <LogoSelector
                growName={growName}
                selectedLogo={selectedLogo}
                onSelectLogo={(logo) => {
                  setSelectedLogo(logo);
                  if (errors.logo) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.logo;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.logo && (
                <div className="onboarding-field-error">{errors.logo}</div>
              )}
            </FormSection>

            <div className="onboarding-actions">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={!growName.trim() || !selectedLogo || isSubmitting}
                size="large"
              >
                Completar configuración
              </Button>
            </div>
          </form>
        </FormCard>
      </div>
    </div>
  );
}
