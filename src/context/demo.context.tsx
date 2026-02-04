import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { generateMockData, type DemoData } from '@/services/onboardingDemo.service';
import { executeScript, type DemoRunnerCallbacks } from '@/services/demoRunner.service';
import type { DemoScript, DemoSpeed } from '@/types/demo.types';

interface DemoContextValue {
  isDemoMode: boolean;
  demoData: DemoData | null;
  activateDemoMode: () => void;
  deactivateDemoMode: () => void;
  // Estado del DemoRunner
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  currentScript: DemoScript | null;
  speed: DemoSpeed;
  sayMessage: string | null;
  // Funciones del DemoRunner
  startDemo: (script: DemoScript, navigateFn?: (route: string) => void) => Promise<void>;
  pauseDemo: () => void;
  resumeDemo: () => void;
  stopDemo: () => void;
  nextStep: () => void;
  skipStep: () => void;
  setSpeed: (speed: DemoSpeed) => void;
  setSayMessage: (message: string | null) => void;
  setNavigateFn: (navigateFn: (route: string) => void) => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<DemoData | null>(null);

  // Estado del DemoRunner
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentScript, setCurrentScript] = useState<DemoScript | null>(null);
  const [speed, setSpeedState] = useState<DemoSpeed>('normal');
  const [sayMessage, setSayMessage] = useState<string | null>(null);

  // Ref para controlar la ejecución del script
  const executionRef = useRef<{
    cancelled: boolean;
    paused: boolean;
  }>({
    cancelled: false,
    paused: false,
  });

  // Ref para la función de navegación
  const navigateFnRef = useRef<((route: string) => void) | null>(null);

  const activateDemoModeRef = useRef(false);
  
  const activateDemoMode = useCallback(() => {
    // Evitar activar si ya está activo o si ya se está activando
    if (activateDemoModeRef.current) {
      return;
    }
    
    if (isDemoMode && demoData) {
      return;
    }
    
    activateDemoModeRef.current = true;
    console.log('Activando modo demo...');
    const mockData = generateMockData();
    // Establecer datos primero, luego el modo
    setDemoData(mockData);
    setIsDemoMode(true);
    console.log('Modo demo activado con', mockData.customers.length, 'clientes,', mockData.products.length, 'productos y', mockData.sales.length, 'ventas');
  }, [isDemoMode, demoData]);

  const stopDemo = useCallback(() => {
    console.log('Deteniendo demo');
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setCurrentScript(null);
    setSayMessage(null);
    executionRef.current.cancelled = true;
    executionRef.current.paused = false;
  }, []);

  const deactivateDemoMode = useCallback(() => {
    console.log('Desactivando modo demo...');
    activateDemoModeRef.current = false;
    setIsDemoMode(false);
    setDemoData(null);
    // Detener DemoRunner si está ejecutando
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setCurrentScript(null);
    setSayMessage(null);
    executionRef.current.cancelled = true;
    executionRef.current.paused = false;
  }, []);

  const startDemo = useCallback(async (
    script: DemoScript,
    navigateFn?: (route: string) => void
  ) => {
    if (!isDemoMode) {
      console.warn('No se puede iniciar demo: modo demo no está activo');
      return;
    }

    if (isRunning && !isPaused) {
      console.warn('Demo ya está ejecutándose');
      return;
    }

    // Guardar función de navegación si se proporciona
    if (navigateFn) {
      navigateFnRef.current = navigateFn;
    }

    if (!navigateFnRef.current) {
      console.warn('No hay función de navegación disponible. El demo no puede ejecutarse.');
      return;
    }

    console.log('Iniciando demo:', script.name);
    setCurrentScript(script);
    setCurrentStep(0);
    setIsRunning(true);
    setIsPaused(false);
    executionRef.current.cancelled = false;
    executionRef.current.paused = false;

    // Ejecutar el script en segundo plano
    const callbacks: DemoRunnerCallbacks = {
      navigate: navigateFnRef.current,
      onMessage: (message: string) => {
        setSayMessage(message);
      },
      onError: (error: Error) => {
        console.error('Error en demo:', error);
      },
    };

    executeScript(
      script.steps,
      callbacks,
      speed,
      (stepIndex) => {
        setCurrentStep(stepIndex + 1);
      },
      () => executionRef.current.cancelled,
      () => executionRef.current.paused
    ).then(() => {
      console.log('Demo completado');
      stopDemo();
    }).catch((error) => {
      console.error('Error ejecutando demo:', error);
      stopDemo();
    });
  }, [isDemoMode, isRunning, isPaused, speed, stopDemo]);

  const pauseDemo = useCallback(() => {
    if (!isRunning) {
      return;
    }
    console.log('Pausando demo');
    setIsPaused(true);
    executionRef.current.paused = true;
  }, [isRunning]);

  const resumeDemo = useCallback(() => {
    if (!isRunning || !isPaused) {
      return;
    }
    console.log('Reanudando demo');
    setIsPaused(false);
    executionRef.current.paused = false;
  }, [isRunning, isPaused]);

  const nextStep = useCallback(() => {
    if (!isRunning || !currentScript) {
      return;
    }
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < currentScript.steps.length) {
      setCurrentStep(nextStepIndex);
    } else {
      // Si es el último paso, detener
      stopDemo();
    }
  }, [isRunning, currentScript, currentStep, stopDemo]);

  const skipStep = useCallback(() => {
    if (!isRunning || !currentScript) {
      return;
    }
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < currentScript.steps.length) {
      setCurrentStep(nextStepIndex);
      console.log(`Saltando al paso ${nextStepIndex + 1}/${currentScript.steps.length}`);
    } else {
      // Si es el último paso, detener
      stopDemo();
    }
  }, [isRunning, currentScript, currentStep, stopDemo]);

  const setSpeed = useCallback((newSpeed: DemoSpeed) => {
    setSpeedState(newSpeed);
    console.log('Velocidad cambiada a:', newSpeed);
  }, []);

  const setNavigateFn = useCallback((navigateFn: (route: string) => void) => {
    navigateFnRef.current = navigateFn;
  }, []);

  const value: DemoContextValue = {
    isDemoMode,
    demoData,
    activateDemoMode,
    deactivateDemoMode,
    // Estado del DemoRunner
    isRunning,
    isPaused,
    currentStep,
    currentScript,
    speed,
    sayMessage,
    // Funciones del DemoRunner
    startDemo,
    pauseDemo,
    resumeDemo,
    stopDemo,
    nextStep,
    skipStep,
    setSpeed,
    setSayMessage,
    setNavigateFn,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo debe usarse dentro de DemoProvider');
  }
  return context;
}
