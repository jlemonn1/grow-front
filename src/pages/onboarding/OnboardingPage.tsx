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

type OnboardingStep = 1 | 2;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { config, loading: configLoading, updateConfiguration, needsOnboarding } = useConfig();
  const { showToast } = useUI();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [growName, setGrowName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<LogoOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Si no necesita onboarding, redirigir a home
  if (!configLoading && !needsOnboarding) {
    navigate('/home', { replace: true });
    return null;
  }

  const validateStep = (step: OnboardingStep): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!growName.trim()) {
        newErrors.growName = 'El nombre del growshop es obligatorio';
      } else if (growName.trim().length < 2) {
        newErrors.growName = 'El nombre debe tener al menos 2 caracteres';
      }
    } else if (step === 2) {
      if (!selectedLogo) {
        newErrors.logo = 'Debes seleccionar o subir un logo';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep(1)) {
        setCurrentStep(2);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setErrors({});
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
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
        enableCustomerBalance: config?.enableCustomerBalance ?? true,
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
          <div className="onboarding-progress">
            <div 
              className={`onboarding-progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep === 1 ? 'current' : ''}`}
            >
              <span className="onboarding-progress-number">1</span>
              <span className="onboarding-progress-label">Nombre</span>
            </div>
            <div className={`onboarding-progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div 
              className={`onboarding-progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''}`}
            >
              <span className="onboarding-progress-number">2</span>
              <span className="onboarding-progress-label">Logo</span>
            </div>
          </div>
        </div>

        <FormCard className="onboarding-form-card">
          <form onSubmit={handleSubmit} className="onboarding-form">
            {errors.submit && (
              <div className="onboarding-error">
                {errors.submit}
              </div>
            )}

            {/* Paso 1: Nombre */}
            {currentStep === 1 && (
              <div className="onboarding-step" key="step-1">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSubmitting && growName.trim().length >= 2) {
                        e.preventDefault();
                        handleNext();
                      }
                    }}
                    error={errors.growName}
                    placeholder="Ej: Mi Growshop"
                    required
                    autoFocus
                    disabled={isSubmitting}
                  />
                </FormSection>
              </div>
            )}

            {/* Paso 2: Logo */}
            {currentStep === 2 && (
              <div className="onboarding-step" key="step-2">
                <FormSection
                  className="onboarding-logo-section"
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
              </div>
            )}

            <div className="onboarding-actions">
              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  size="large"
                >
                  Siguiente
                </Button>
              )}
              {currentStep === 2 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    size="large"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    disabled={!growName.trim() || !selectedLogo || isSubmitting}
                    size="large"
                  >
                    Completar configuración
                  </Button>
                </>
              )}
            </div>
          </form>
        </FormCard>
      </div>
    </div>
  );
}
