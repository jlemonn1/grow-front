import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/context/demo.context';
import { demoRunner } from '@/services/demoRunner.service';
import { DemoControls } from './DemoControls';
import type { DemoStep, SayStep } from '@/types/demo.types';
import './DemoRunner.css';

interface DemoRunnerProps {
  script?: import('@/types/demo.types').DemoScript;
}

/**
 * Componente principal que ejecuta scripts de demostración automáticamente
 * Maneja la ejecución secuencial de pasos, pausa/resume, y muestra mensajes "say"
 */
export function DemoRunner({ script }: DemoRunnerProps) {
  const navigate = useNavigate();
  const {
    isDemoMode,
    isRunning,
    isPaused,
    currentStep,
    currentScript,
    speed,
    sayMessage,
    setSayMessage,
    startDemo,
    stopDemo,
    nextStep,
  } = useDemo();

  const executionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configurar función de navegación en el servicio
  useEffect(() => {
    demoRunner.setNavigateFn(navigate);
  }, [navigate]);

  // Iniciar script si se proporciona como prop y el modo demo está activo
  useEffect(() => {
    if (script && isDemoMode && !isRunning && !currentScript) {
      startDemo(script);
    }
  }, [script, isDemoMode, isRunning, currentScript, startDemo]);

  // Ejecutar pasos del script
  useEffect(() => {
    // Limpiar timeouts anteriores
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
      executionTimeoutRef.current = null;
    }
    if (sayTimeoutRef.current) {
      clearTimeout(sayTimeoutRef.current);
      sayTimeoutRef.current = null;
    }

    // No ejecutar si no está corriendo o está pausado
    if (!isRunning || isPaused || !currentScript) {
      return;
    }

    // Si ya completamos todos los pasos, detener
    if (currentStep >= currentScript.steps.length) {
      console.log('Demo completado');
      stopDemo();
      return;
    }

    const step = currentScript.steps[currentStep] as DemoStep;

    // Ejecutar el paso
    const executeStep = async () => {
      try {
        // Si es un paso "say", mostrar el mensaje
        if (step.type === 'say') {
          const sayStep = step as SayStep;
          setSayMessage(sayStep.message);
          const duration = sayStep.duration || 2000;

          // Limpiar mensaje después de la duración
          sayTimeoutRef.current = setTimeout(() => {
            setSayMessage(null);
          }, duration);

          // Avanzar al siguiente paso después de mostrar el mensaje
          executionTimeoutRef.current = setTimeout(() => {
            nextStep();
          }, duration);
        } else {
          // Ejecutar el paso usando el servicio
          await demoRunner.executeStep(step, speed);
          // Avanzar al siguiente paso después de ejecutar
          nextStep();
        }
      } catch (error) {
        console.error(`Error ejecutando paso ${currentStep + 1}:`, error);
        // Continuar con el siguiente paso aunque haya error
        nextStep();
      }
    };

    executeStep();

    // Cleanup
    return () => {
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
      if (sayTimeoutRef.current) {
        clearTimeout(sayTimeoutRef.current);
      }
    };
  }, [isRunning, isPaused, currentStep, currentScript, speed, setSayMessage, stopDemo, nextStep]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (executionTimeoutRef.current) {
        clearTimeout(executionTimeoutRef.current);
      }
      if (sayTimeoutRef.current) {
        clearTimeout(sayTimeoutRef.current);
      }
    };
  }, []);

  // No renderizar nada si no está en modo demo o no hay script
  if (!isDemoMode || !currentScript) {
    return null;
  }

  return (
    <>
      <DemoControls />
      {sayMessage && (
        <div className="demo-say-overlay">
          <div className="demo-say-message">{sayMessage}</div>
        </div>
      )}
    </>
  );
}
