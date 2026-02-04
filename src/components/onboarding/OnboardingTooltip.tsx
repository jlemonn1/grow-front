import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/common/Button';
import './OnboardingTooltip.css';

interface OnboardingTooltipProps {
  targetElement: HTMLElement | null;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  showPrevious?: boolean;
  showNext?: boolean;
  showSkip?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isVisible: boolean;
}

/**
 * Tooltip explicativo que se posiciona cerca del elemento objetivo
 */
export function OnboardingTooltip({
  targetElement,
  title,
  description,
  position = 'bottom',
  showPrevious = false,
  showNext = true,
  showSkip = true,
  onNext,
  onPrevious,
  onSkip,
  isVisible,
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!tooltipRef.current) return;

      const tooltip = tooltipRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Si hay targetElement, posicionar relativo a él
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();

        switch (position) {
          case 'top':
            top = rect.top - tooltipRect.height - 20;
            left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipRect.height / 2;
            left = rect.left - tooltipRect.width - 20;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipRect.height / 2;
            left = rect.right + 20;
            break;
          case 'center':
            top = window.innerHeight / 2 - tooltipRect.height / 2;
            left = window.innerWidth / 2 - tooltipRect.width / 2;
            break;
        }
      } else {
        // Si no hay targetElement, usar posición center por defecto
        top = window.innerHeight / 2 - tooltipRect.height / 2;
        left = window.innerWidth / 2 - tooltipRect.width / 2;
      }

      // Asegurar que el tooltip esté dentro de la ventana
      const padding = 20;
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

      setTooltipPosition({ top, left });
    };

    // Esperar un frame para que el tooltip se renderice y tenga dimensiones
    requestAnimationFrame(() => {
      updatePosition();
    });

    // Solo agregar listeners si hay targetElement
    if (targetElement) {
      window.addEventListener('scroll', updatePosition, true);
    }
    window.addEventListener('resize', updatePosition);

    return () => {
      if (targetElement) {
        window.removeEventListener('scroll', updatePosition, true);
      }
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, targetElement, position]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className={`onboarding-tooltip onboarding-tooltip--${position}`}
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }}
    >
      <div className="onboarding-tooltip__content">
        <h3 className="onboarding-tooltip__title">{title}</h3>
        <p className="onboarding-tooltip__description">{description}</p>
      </div>
      <div className="onboarding-tooltip__actions">
        {showPrevious && (
          <Button
            variant="secondary"
            size="small"
            onClick={onPrevious}
          >
            Anterior
          </Button>
        )}
        {showSkip && (
          <Button
            variant="secondary"
            size="small"
            onClick={onSkip}
          >
            Saltar
          </Button>
        )}
        {showNext && (
          <Button
            variant="primary"
            size="small"
            onClick={onNext}
          >
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
