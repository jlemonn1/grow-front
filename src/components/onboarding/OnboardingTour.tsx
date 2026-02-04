import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { OnboardingOverlay } from './OnboardingOverlay';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingStepIndicator } from './OnboardingStepIndicator';
import { Spinner } from '@/components/common/Spinner';
import './OnboardingTour.css';

interface OnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Componente principal del tour de onboarding
 * Maneja la navegación automática y el resaltado de elementos
 */
export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const {
    currentStep,
    totalSteps,
    currentStepData,
    targetElement,
    isLoading,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
  } = useOnboardingTour();
  
  const tourStartedRef = useRef(false);

  // Iniciar tour al montar (solo una vez)
  useEffect(() => {
    if (tourStartedRef.current) {
      return;
    }
    tourStartedRef.current = true;
    
    startTour().catch((error) => {
      console.error('Error iniciando tour:', error);
      tourStartedRef.current = false; // Permitir reintentar si falla
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Manejar completado
  const handleComplete = () => {
    completeTour();
    onComplete?.();
  };

  // Manejar skip
  const handleSkip = () => {
    skipTour();
    onSkip?.();
  };

  if (isLoading) {
    return createPortal(
      <div className="onboarding-tour-loading">
        <Spinner size="lg" />
        <p>Preparando la demostración...</p>
      </div>,
      document.body
    );
  }

  if (!currentStepData) {
    return null;
  }

  // Los nombres de los pasos se obtienen del currentStepData, no necesitamos TOUR_STEPS aquí
  const stepNames: string[] = [];

  // Renderizar el tour directamente en el body usando portal para que esté por encima de todo
  return createPortal(
    <>
      <OnboardingStepIndicator
        currentStep={currentStep + 1}
        totalSteps={totalSteps}
        stepNames={stepNames}
      />
      <OnboardingOverlay
        targetElement={targetElement}
        isVisible={true}
        onClick={nextStep}
      />
      <OnboardingTooltip
        targetElement={targetElement}
        title={currentStepData.title}
        description={currentStepData.description}
        position={currentStepData.position || 'bottom'}
        showPrevious={currentStep > 0}
        showNext={true}
        showSkip={true}
        onNext={currentStep === totalSteps - 1 ? handleComplete : nextStep}
        onPrevious={previousStep}
        onSkip={handleSkip}
        isVisible={true}
      />
    </>,
    document.body
  );
}
