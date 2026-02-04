import { useEffect, useRef } from 'react';
import './OnboardingOverlay.css';

interface OnboardingOverlayProps {
  targetElement: HTMLElement | null;
  isVisible: boolean;
  onClick?: () => void;
}

/**
 * Overlay oscuro con efecto spotlight que resalta un elemento específico
 */
export function OnboardingOverlay({ targetElement, isVisible, onClick }: OnboardingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !overlayRef.current) {
      return;
    }

    const overlay = overlayRef.current;

    // Si no hay targetElement, mostrar overlay completo sin spotlight
    if (!targetElement) {
      overlay.style.clipPath = '';
      overlay.style.maskImage = '';
      overlay.style.webkitMaskImage = '';
      return;
    }

    const updateSpotlight = () => {
      if (!targetElement || !overlayRef.current) return;

      const rect = targetElement.getBoundingClientRect();
      const overlay = overlayRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calcular posición y tamaño del spotlight con padding
      const padding = 20;
      const spotlightLeft = Math.max(0, rect.left - padding);
      const spotlightTop = Math.max(0, rect.top - padding);
      const spotlightRight = Math.min(viewportWidth, rect.right + padding);
      const spotlightBottom = Math.min(viewportHeight, rect.bottom + padding);
      // Usar clip-path con polygon para crear un agujero rectangular
      // El polygon crea un rectángulo que cubre toda la pantalla excepto el área del spotlight
      const clipPath = `polygon(
        0% 0%,
        0% 100%,
        ${(spotlightLeft / viewportWidth) * 100}% 100%,
        ${(spotlightLeft / viewportWidth) * 100}% ${(spotlightTop / viewportHeight) * 100}%,
        ${(spotlightRight / viewportWidth) * 100}% ${(spotlightTop / viewportHeight) * 100}%,
        ${(spotlightRight / viewportWidth) * 100}% ${(spotlightBottom / viewportHeight) * 100}%,
        ${(spotlightLeft / viewportWidth) * 100}% ${(spotlightBottom / viewportHeight) * 100}%,
        ${(spotlightLeft / viewportWidth) * 100}% 100%,
        100% 100%,
        100% 0%
      )`;

      overlay.style.clipPath = clipPath;
      overlay.style.maskImage = '';
      overlay.style.webkitMaskImage = '';
    };

    // Actualizar al montar y al hacer scroll/resize
    updateSpotlight();
    const scrollHandler = () => updateSpotlight();
    const resizeHandler = () => updateSpotlight();
    
    window.addEventListener('scroll', scrollHandler, true);
    window.addEventListener('resize', resizeHandler);

    // También actualizar cuando el elemento objetivo cambia de posición
    const observer = new MutationObserver(updateSpotlight);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('scroll', scrollHandler, true);
      window.removeEventListener('resize', resizeHandler);
      observer.disconnect();
    };
  }, [isVisible, targetElement]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="onboarding-overlay"
      onClick={onClick}
    />
  );
}
