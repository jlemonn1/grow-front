import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { Spinner } from '@/components/common/Spinner';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import './SimpleOnboardingTour.css';

interface SimpleOnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Componente de onboarding simple sin overlay complejo
 * Usa highlight directo en elementos y tooltips flotantes
 */
export function SimpleOnboardingTour({ onComplete, onSkip }: SimpleOnboardingTourProps) {
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
    goToStep,
    isTourStarted,
    executePendingProductClick,
  } = useOnboardingTour();
  
  const startTourRef = useRef(startTour);
  const [stepInputValue, setStepInputValue] = useState<string>('');

  // Actualizar ref de startTour cuando cambia
  useEffect(() => {
    startTourRef.current = startTour;
  }, [startTour]);

  // Iniciar tour UNA SOLA VEZ al montar
  // Usar sessionStorage para evitar múltiples inicios incluso si el componente se re-monta
  const initAttemptedRef = useRef(false);
  const TOUR_STARTED_KEY = 'onboarding_tour_started';
  
  useEffect(() => {
    // Easter egg: verificar si hay parámetro force=true en la URL
    const searchParams = new URLSearchParams(window.location.search);
    const forceAccess = searchParams.get('force') === 'true';
    
    // Verificar si ya se inició en esta sesión (persistente incluso si el componente se re-monta)
    const tourStartedInSession = sessionStorage.getItem(TOUR_STARTED_KEY) === 'true';
    
    // Si es acceso forzado, resetear todo antes de iniciar
    if (forceAccess) {
      console.log('[SimpleOnboardingTour] 🎯 Acceso forzado detectado, reiniciando tour...');
      initAttemptedRef.current = false;
      sessionStorage.removeItem(TOUR_STARTED_KEY);
    }
    
    // Si ya se intentó iniciar en este render, no intentar de nuevo (a menos que sea acceso forzado)
    if (initAttemptedRef.current && !forceAccess) {
      return;
    }
    
    // Si el tour ya está iniciado (estado del hook), no hacer nada (a menos que sea acceso forzado)
    if (isTourStarted && !forceAccess) {
      console.log('[SimpleOnboardingTour] Tour ya iniciado (estado), no iniciando');
      return;
    }
    
    // Si ya se inició en esta sesión, no iniciar de nuevo (a menos que sea acceso forzado)
    if (tourStartedInSession && !forceAccess) {
      console.log('[SimpleOnboardingTour] Tour ya iniciado en esta sesión, no iniciando');
      return;
    }
    
    // Marcar como intentado INMEDIATAMENTE
    initAttemptedRef.current = true;
    sessionStorage.setItem(TOUR_STARTED_KEY, 'true');
    
    console.log('[SimpleOnboardingTour] Iniciando tour unificado...');
    startTourRef.current()
      .then(() => {
        console.log('[SimpleOnboardingTour] Tour iniciado correctamente');
      })
      .catch((error) => {
        console.error('[SimpleOnboardingTour] Error iniciando tour:', error);
        // Si falla, permitir reintentar limpiando el flag
        initAttemptedRef.current = false;
        sessionStorage.removeItem(TOUR_STARTED_KEY);
      });
  }, [isTourStarted]); // Incluir isTourStarted para detectar cambios cuando se resetea

  // Manejar avance automático - igual que fase 1
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoAdvancedStepRef = useRef<number>(-1);
  const currentStepDataRef = useRef(currentStepData);
  const scheduledStepRef = useRef<number>(-1); // Paso para el que se programó el timer
  
  // Actualizar ref cuando cambia currentStepData
  useEffect(() => {
    console.log(`[SimpleOnboardingTour] currentStepData cambió:`, {
      step: currentStepData?.id,
      title: currentStepData?.title,
      autoAdvance: currentStepData?.autoAdvance,
      autoAdvanceDelay: currentStepData?.autoAdvanceDelay,
    });
    currentStepDataRef.current = currentStepData;
  }, [currentStepData]);
  
  useEffect(() => {
    console.log(`[SimpleOnboardingTour] useEffect autoAdvance ejecutado:`, {
      currentStep,
      lastAutoAdvancedStep: lastAutoAdvancedStepRef.current,
      scheduledStep: scheduledStepRef.current,
      timerExists: !!autoAdvanceTimerRef.current,
      stepData: currentStepDataRef.current ? {
        id: currentStepDataRef.current.id,
        title: currentStepDataRef.current.title,
        autoAdvance: currentStepDataRef.current.autoAdvance,
        autoAdvanceDelay: currentStepDataRef.current.autoAdvanceDelay,
      } : null,
    });
    
    const stepData = currentStepDataRef.current;
    if (!stepData) {
      console.log(`[SimpleOnboardingTour] No hay stepData, saliendo`);
      // Limpiar timer si existe
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      scheduledStepRef.current = -1;
      return;
    }
    
    if (!stepData.autoAdvance) {
      console.log(`[SimpleOnboardingTour] Paso ${currentStep} no tiene autoAdvance, saliendo`);
      // Limpiar timer si existe y resetear flags
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      if (lastAutoAdvancedStepRef.current === currentStep) {
        lastAutoAdvancedStepRef.current = -1;
      }
      scheduledStepRef.current = -1;
      return;
    }
    
    // Si ya programamos el timer para este paso, no hacer nada
    if (scheduledStepRef.current === currentStep && autoAdvanceTimerRef.current) {
      console.log(`[SimpleOnboardingTour] Timer ya programado para paso ${currentStep}, no reprogramando`);
      return;
    }
    
    // Si ya avanzamos este paso, no avanzar de nuevo
    if (lastAutoAdvancedStepRef.current === currentStep) {
      console.log(`[SimpleOnboardingTour] Ya avanzamos paso ${currentStep}, saltando`);
      return;
    }
    
    // Limpiar timer anterior SIEMPRE antes de programar uno nuevo (mejor seguridad)
    if (autoAdvanceTimerRef.current) {
      console.log(`[SimpleOnboardingTour] Limpiando timer anterior (paso ${scheduledStepRef.current} -> ${currentStep})`);
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    
    const delay = stepData.autoAdvanceDelay || 2000;
    const stepTitle = stepData.title;
    scheduledStepRef.current = currentStep;
    
    console.log(`[SimpleOnboardingTour] ✓ Programando avance automático para paso ${currentStep}: "${stepTitle}" (delay: ${delay}ms)`);
    
    autoAdvanceTimerRef.current = setTimeout(() => {
      console.log(`[SimpleOnboardingTour] ✓✓✓ EJECUTANDO avance automático para paso ${currentStep}: "${stepTitle}"`);
      console.log(`[SimpleOnboardingTour] Llamando nextStep()...`);
      autoAdvanceTimerRef.current = null;
      scheduledStepRef.current = -1;
      lastAutoAdvancedStepRef.current = currentStep;
      nextStep();
      console.log(`[SimpleOnboardingTour] nextStep() llamado`);
    }, delay);
    
    console.log(`[SimpleOnboardingTour] Timer programado con ID:`, autoAdvanceTimerRef.current);

    return () => {
      // Limpiar timer SIEMPRE en cleanup para evitar ejecuciones después de desmontar
      if (autoAdvanceTimerRef.current) {
        console.log(`[SimpleOnboardingTour] Cleanup: limpiando timer (paso ${scheduledStepRef.current})`);
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      scheduledStepRef.current = -1;
    };
  }, [currentStep, nextStep]);

  // Aplicar highlight cuando cambia el elemento objetivo
  useEffect(() => {
    // Limpiar highlight anterior
    const previousHighlighted = document.querySelector('.simple-onboarding-highlight-target');
    if (previousHighlighted) {
      previousHighlighted.classList.remove('simple-onboarding-highlight-target');
    }

    if (!targetElement || !currentStepData) {
      if (!targetElement) {
        console.log('[SimpleOnboardingTour] No hay elemento objetivo para resaltar');
      }
      return;
    }

    console.log(`[SimpleOnboardingTour] Aplicando highlight a elemento:`, targetElement);
    console.log(`[SimpleOnboardingTour] Paso actual: ${currentStepData.title}`);

    // Aplicar highlight al elemento objetivo
    targetElement.classList.add('simple-onboarding-highlight-target');

    return () => {
      // Limpiar highlight al desmontar
      if (targetElement) {
        targetElement.classList.remove('simple-onboarding-highlight-target');
      }
    };
  }, [targetElement, currentStepData]);

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

  // Detectar si estamos en el paso de transición
  const isTransitionStep = currentStepData?.id === 'transition-to-products' || 
                           currentStepData?.id === 'transition-to-products-list' ||
                           currentStepData?.id === 'transition-to-product-detail' ||
                           currentStepData?.id === 'transition-to-customers' ||
                           currentStepData?.id === 'transition-to-customer-create' ||
                           currentStepData?.id === 'transition-to-customer-detail';
  const isTransitionToProducts = currentStepData?.id === 'transition-to-products';
  const isTransitionToProductsList = currentStepData?.id === 'transition-to-products-list';
  const isTransitionToProductDetail = currentStepData?.id === 'transition-to-product-detail';
  const isTransitionToCustomers = currentStepData?.id === 'transition-to-customers';
  const isTransitionToCustomerCreate = currentStepData?.id === 'transition-to-customer-create';
  const isTransitionToCustomerDetail = currentStepData?.id === 'transition-to-customer-detail';

  // Manejar carga de página en paso de transición a productos (crear)
  const handleLoadPage = async () => {
    console.log('[SimpleOnboardingTour] Botón "Cargar página" presionado (transition-to-products)');
    
    // Disparar evento personalizado para forzar refresh en TourPageRenderer
    // Incluir información sobre el tipo de transición
    const refreshEvent = new CustomEvent('tour:force-page-refresh', {
      detail: { transitionType: 'products-create' }
    });
    window.dispatchEvent(refreshEvent);
    console.log('[SimpleOnboardingTour] Evento de refresh disparado (transition-to-products)');
    
    // Esperar a que la nueva página se renderice completamente
    // Buscar el contenedor de productos que debería aparecer
    console.log('[SimpleOnboardingTour] Esperando a que la página de productos se renderice...');
    let containerFound = false;
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 segundos máximo
    
    while (!containerFound && attempts < maxAttempts) {
      const container = document.querySelector('.product-create-container');
      if (container) {
        console.log(`[SimpleOnboardingTour] ✓ Contenedor de productos encontrado después de ${attempts} intentos`);
        containerFound = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`[SimpleOnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando contenedor...`);
      }
    }
    
    if (!containerFound) {
      console.warn('[SimpleOnboardingTour] ⚠️ Contenedor no encontrado después de esperar, pero continuando...');
      // Esperar un tiempo adicional como fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Esperar un poco más para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Avanzar al siguiente paso (que será el primer paso de la nueva página)
    console.log('[SimpleOnboardingTour] Avanzando al siguiente paso después de cargar página');
    nextStep();
  };

  // Manejar carga de página en paso de transición a lista de productos
  const handleLoadProductsList = async () => {
    console.log('[SimpleOnboardingTour] Botón "Cargar página" presionado (transition-to-products-list)');
    
    // Disparar evento personalizado para forzar refresh en TourPageRenderer
    // Incluir información sobre el tipo de transición
    const refreshEvent = new CustomEvent('tour:force-page-refresh', {
      detail: { transitionType: 'products-list' }
    });
    window.dispatchEvent(refreshEvent);
    console.log('[SimpleOnboardingTour] Evento de refresh disparado (transition-to-products-list)');
    
    // Esperar a que la nueva página se renderice completamente
    // Buscar el contenedor de lista de productos que debería aparecer
    console.log('[SimpleOnboardingTour] Esperando a que la página de lista de productos se renderice...');
    let containerFound = false;
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 segundos máximo
    
    while (!containerFound && attempts < maxAttempts) {
      const container = document.querySelector('.products-page-container');
      if (container) {
        console.log(`[SimpleOnboardingTour] ✓ Contenedor de lista de productos encontrado después de ${attempts} intentos`);
        containerFound = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`[SimpleOnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando contenedor...`);
      }
    }
    
    if (!containerFound) {
      console.warn('[SimpleOnboardingTour] ⚠️ Contenedor no encontrado después de esperar, pero continuando...');
      // Esperar un tiempo adicional como fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Esperar un poco más para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Avanzar al siguiente paso (que será el primer paso de la nueva página)
    console.log('[SimpleOnboardingTour] Avanzando al siguiente paso después de cargar página');
    nextStep();
  };

  // Manejar carga de página en paso de transición a detalle de producto
  const handleLoadProductDetail = async () => {
    console.log('[SimpleOnboardingTour] 🔘 Botón "Cargar página" presionado (transition-to-product-detail)');
    console.log('[SimpleOnboardingTour] 📋 Estado antes de ejecutar click pendiente:', {
      hasExecuteFunction: !!executePendingProductClick,
      currentStep: currentStep,
      currentStepData: currentStepData?.id
    });
    
    // Ejecutar el click pendiente en el producto antes de disparar el evento
    if (executePendingProductClick) {
      console.log('[SimpleOnboardingTour] ⚡ Ejecutando click pendiente en producto');
      try {
        executePendingProductClick();
        console.log('[SimpleOnboardingTour] ✅ Click pendiente ejecutado, esperando procesamiento...');
        // Esperar un momento para que el click se procese
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('[SimpleOnboardingTour] ✅ Espera completada después del click');
      } catch (error) {
        console.error('[SimpleOnboardingTour] ❌ Error ejecutando click pendiente:', error);
      }
    } else {
      console.warn('[SimpleOnboardingTour] ⚠️ executePendingProductClick no está disponible');
    }
    
    // Disparar evento personalizado para forzar refresh en TourPageRenderer
    // Incluir información sobre el tipo de transición
    const refreshEvent = new CustomEvent('tour:force-page-refresh', {
      detail: { transitionType: 'product-detail' }
    });
    window.dispatchEvent(refreshEvent);
    console.log('[SimpleOnboardingTour] Evento de refresh disparado (transition-to-product-detail)');
    
    // Esperar a que la nueva página se renderice completamente
    // Buscar el contenedor de detalle de producto que debería aparecer
    console.log('[SimpleOnboardingTour] Esperando a que la página de detalle de producto se renderice...');
    let containerFound = false;
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 segundos máximo
    
    while (!containerFound && attempts < maxAttempts) {
      const container = document.querySelector('.product-detail-container');
      if (container) {
        console.log(`[SimpleOnboardingTour] ✓ Contenedor de detalle de producto encontrado después de ${attempts} intentos`);
        containerFound = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`[SimpleOnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando contenedor...`);
      }
    }
    
    if (!containerFound) {
      console.warn('[SimpleOnboardingTour] ⚠️ Contenedor no encontrado después de esperar, pero continuando...');
      // Esperar un tiempo adicional como fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Esperar un poco más para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Avanzar al siguiente paso (que será el primer paso de la nueva página)
    console.log('[SimpleOnboardingTour] Avanzando al siguiente paso después de cargar página');
    nextStep();
  };

  // Manejar carga de página en paso de transición a clientes (lista)
  const handleLoadCustomers = async () => {
    console.log('[SimpleOnboardingTour] Botón "Cargar página" presionado (transition-to-customers)');
    
    // Disparar evento personalizado para forzar refresh en TourPageRenderer
    // Incluir información sobre el tipo de transición
    const refreshEvent = new CustomEvent('tour:force-page-refresh', {
      detail: { transitionType: 'customers-list' }
    });
    window.dispatchEvent(refreshEvent);
    console.log('[SimpleOnboardingTour] Evento de refresh disparado (transition-to-customers)');
    
    // Esperar a que la nueva página se renderice completamente
    // Buscar el contenedor de clientes que debería aparecer
    console.log('[SimpleOnboardingTour] Esperando a que la página de clientes se renderice...');
    let containerFound = false;
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 segundos máximo
    
    while (!containerFound && attempts < maxAttempts) {
      const container = document.querySelector('.customers-page-container');
      if (container) {
        console.log(`[SimpleOnboardingTour] ✓ Contenedor de clientes encontrado después de ${attempts} intentos`);
        containerFound = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`[SimpleOnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando contenedor...`);
      }
    }
    
    if (!containerFound) {
      console.warn('[SimpleOnboardingTour] ⚠️ Contenedor no encontrado después de esperar, pero continuando...');
      // Esperar un tiempo adicional como fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Esperar un poco más para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Avanzar al siguiente paso (que será el primer paso de la nueva página)
    console.log('[SimpleOnboardingTour] Avanzando al siguiente paso después de cargar página');
    nextStep();
  };

  // Manejar carga de página en paso de transición a crear cliente
  const handleLoadCustomerCreate = async () => {
    console.log('[SimpleOnboardingTour] Botón "Cargar página" presionado (transition-to-customer-create)');
    
    // Disparar evento personalizado para forzar refresh en TourPageRenderer
    // Incluir información sobre el tipo de transición
    const refreshEvent = new CustomEvent('tour:force-page-refresh', {
      detail: { transitionType: 'customers-create' }
    });
    window.dispatchEvent(refreshEvent);
    console.log('[SimpleOnboardingTour] Evento de refresh disparado (transition-to-customer-create)');
    
    // Esperar a que la nueva página se renderice completamente
    // Buscar el contenedor de crear cliente que debería aparecer
    console.log('[SimpleOnboardingTour] Esperando a que la página de crear cliente se renderice...');
    let containerFound = false;
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 segundos máximo
    
    while (!containerFound && attempts < maxAttempts) {
      const container = document.querySelector('.customer-create-container');
      if (container) {
        console.log(`[SimpleOnboardingTour] ✓ Contenedor de crear cliente encontrado después de ${attempts} intentos`);
        containerFound = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`[SimpleOnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando contenedor...`);
      }
    }
    
    if (!containerFound) {
      console.warn('[SimpleOnboardingTour] ⚠️ Contenedor no encontrado después de esperar, pero continuando...');
      // Esperar un tiempo adicional como fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Esperar un poco más para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Avanzar al siguiente paso (que será el primer paso de la nueva página)
    console.log('[SimpleOnboardingTour] Avanzando al siguiente paso después de cargar página');
    nextStep();
  };

  // Manejar carga de página en paso de transición a detalle de cliente
  const handleLoadCustomerDetail = async () => {
    console.log('[SimpleOnboardingTour] 🔘 Botón "Cargar página" presionado (transition-to-customer-detail)');
    
    // Disparar evento personalizado para forzar refresh en TourPageRenderer
    // Incluir información sobre el tipo de transición
    const refreshEvent = new CustomEvent('tour:force-page-refresh', {
      detail: { transitionType: 'customer-detail' }
    });
    window.dispatchEvent(refreshEvent);
    console.log('[SimpleOnboardingTour] Evento de refresh disparado (transition-to-customer-detail)');
    
    // Esperar a que la nueva página se renderice completamente
    // Buscar el contenedor de detalle de cliente que debería aparecer
    console.log('[SimpleOnboardingTour] Esperando a que la página de detalle de cliente se renderice...');
    let containerFound = false;
    let attempts = 0;
    const maxAttempts = 50; // 50 * 100ms = 5 segundos máximo
    
    while (!containerFound && attempts < maxAttempts) {
      const container = document.querySelector('.customer-detail-container');
      if (container) {
        console.log(`[SimpleOnboardingTour] ✓ Contenedor de detalle de cliente encontrado después de ${attempts} intentos`);
        containerFound = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`[SimpleOnboardingTour] Intento ${attempts}/${maxAttempts} - Esperando contenedor...`);
      }
    }
    
    if (!containerFound) {
      console.warn('[SimpleOnboardingTour] ⚠️ Contenedor no encontrado después de esperar, pero continuando...');
      // Esperar un tiempo adicional como fallback
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Esperar un poco más para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Avanzar al siguiente paso (que será el primer paso de la nueva página)
    console.log('[SimpleOnboardingTour] Avanzando al siguiente paso después de cargar página');
    nextStep();
  };

  // Manejar cambio de paso desde input
  const handleStepInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStepInputValue(value);
  };

  // Manejar ir a paso específico
  const handleGoToStep = () => {
    const stepNumber = parseInt(stepInputValue, 10);
    if (!isNaN(stepNumber) && stepNumber >= 1 && stepNumber <= totalSteps) {
      goToStep(stepNumber - 1); // Convertir a índice base 0
      setStepInputValue('');
    }
  };

  // Manejar Enter en el input
  const handleStepInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToStep();
    }
  };

  // Actualizar input cuando cambia el paso actual
  useEffect(() => {
    setStepInputValue('');
  }, [currentStep]);

  // Agregar clase al body cuando el tour está activo
  useEffect(() => {
    if (currentStepData && !isLoading) {
      document.body.classList.add('onboarding-tour-active');
    } else {
      document.body.classList.remove('onboarding-tour-active');
    }
    return () => {
      document.body.classList.remove('onboarding-tour-active');
    };
  }, [currentStepData, isLoading]);

  if (isLoading) {
    return createPortal(
      <div className="simple-onboarding-loading">
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

  return createPortal(
    <>
      {/* Componente integrado: Progress + Tooltip + Navegación */}
      <div className="simple-onboarding-integrated">
        {/* Barra de progreso */}
        <div className="simple-onboarding-progress-bar">
          <div 
            className="simple-onboarding-progress-fill"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Contenido principal */}
        <div className="simple-onboarding-integrated-content">
          {/* Flecha anterior */}
          <button
            className="simple-onboarding-nav-button simple-onboarding-nav-prev"
            onClick={previousStep}
            disabled={currentStep === 0}
            aria-label="Paso anterior"
          >
            <HiChevronLeft />
          </button>

          {/* Información del paso */}
          <div className="simple-onboarding-step-info">
            <div className="simple-onboarding-step-counter">
              Paso {currentStep + 1} de {totalSteps}
            </div>
            <div className="simple-onboarding-step-title">{currentStepData.title}</div>
            <div className="simple-onboarding-step-description">{currentStepData.description}</div>
          </div>

          {/* Input para ir a paso específico */}
          <div className="simple-onboarding-step-input-container">
            <input
              type="number"
              className="simple-onboarding-step-input"
              placeholder={`1-${totalSteps}`}
              value={stepInputValue}
              onChange={handleStepInputChange}
              onKeyDown={handleStepInputKeyDown}
              min={1}
              max={totalSteps}
              aria-label="Ir a paso específico"
            />
            <button
              className="simple-onboarding-go-button"
              onClick={handleGoToStep}
              disabled={!stepInputValue || isNaN(parseInt(stepInputValue, 10)) || parseInt(stepInputValue, 10) < 1 || parseInt(stepInputValue, 10) > totalSteps}
              aria-label="Ir al paso"
            >
              Ir
            </button>
          </div>

          {/* Botón siguiente o "Cargar página" para paso de transición */}
          {isTransitionStep ? (
            <button
              className="simple-onboarding-load-page-button"
              onClick={
                isTransitionToProductDetail 
                  ? handleLoadProductDetail 
                  : isTransitionToProductsList 
                    ? handleLoadProductsList 
                    : isTransitionToCustomerDetail
                    ? handleLoadCustomerDetail
                    : isTransitionToCustomerCreate
                    ? handleLoadCustomerCreate
                    : isTransitionToCustomers
                    ? handleLoadCustomers
                    : handleLoadPage
              }
              aria-label="Cargar página"
            >
              Cargar página
            </button>
          ) : (
            <button
              className={`simple-onboarding-nav-button simple-onboarding-nav-next ${!currentStepData?.autoAdvance ? 'simple-onboarding-nav-button-pulse' : ''}`}
              onClick={currentStep === totalSteps - 1 ? handleComplete : nextStep}
              disabled={currentStepData?.autoAdvance}
              aria-label={currentStep === totalSteps - 1 ? "Finalizar" : "Siguiente paso"}
            >
              <HiChevronRight />
            </button>
          )}

          {/* Botón saltar */}
          <button
            className="simple-onboarding-skip-button"
            onClick={handleSkip}
            aria-label="Saltar tour"
          >
            Saltar
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
