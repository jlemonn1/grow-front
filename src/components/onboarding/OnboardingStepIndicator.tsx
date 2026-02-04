import './OnboardingStepIndicator.css';

interface OnboardingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
}

/**
 * Indicador de progreso que muestra el paso actual del tour
 */
export function OnboardingStepIndicator({
  currentStep,
  totalSteps,
  stepNames = [],
}: OnboardingStepIndicatorProps) {
  return (
    <div className="onboarding-step-indicator">
      <div className="onboarding-step-indicator__progress">
        <div
          className="onboarding-step-indicator__progress-bar"
          style={{
            width: `${(currentStep / totalSteps) * 100}%`,
          }}
        />
      </div>
      <div className="onboarding-step-indicator__info">
        <span className="onboarding-step-indicator__step">
          Paso {currentStep} de {totalSteps}
        </span>
        {stepNames[currentStep - 1] && (
          <span className="onboarding-step-indicator__name">
            {stepNames[currentStep - 1]}
          </span>
        )}
      </div>
    </div>
  );
}
