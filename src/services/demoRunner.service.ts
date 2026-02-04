/**
 * Servicio para ejecutar scripts de demostración (DemoRunner)
 */

import type {
  DemoStep,
  NavigateStep,
  ClickStep,
  TypeStep,
  SelectStep,
  AssertStep,
  WaitForStep,
  SayStep,
} from '@/types/demo.types';
import { waitForElement, simulateInput } from '@/utils/demoUtils';

/**
 * Callbacks para interactuar con React Router y mostrar mensajes
 */
export interface DemoRunnerCallbacks {
  navigate: (route: string) => void;
  onMessage?: (message: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Ejecuta un paso de navegación
 */
async function executeNavigateStep(
  step: NavigateStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  callbacks.navigate(step.route);
  // Esperar un poco para que la página cargue
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Ejecuta un paso de click
 */
async function executeClickStep(
  step: ClickStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  const timeout = step.timeout || 5000;
  
  try {
    const element = await waitForElement(step.selector, timeout);
    
    if (!element) {
      throw new Error(`Elemento no encontrado: ${step.selector}`);
    }

    // Hacer scroll al elemento si es necesario
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Hacer click
    if (element instanceof HTMLElement) {
      element.click();
    } else {
      // Si es un elemento que no tiene click nativo, disparar evento
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      // Todos los elementos del DOM son EventTarget
      (element as EventTarget).dispatchEvent(clickEvent);
    }
    
    // Esperar un poco después del click para que se procese
    await new Promise(resolve => setTimeout(resolve, 300));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

/**
 * Ejecuta un paso de escritura
 */
async function executeTypeStep(
  step: TypeStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  const timeout = step.timeout || 5000;
  
  try {
    const element = await waitForElement(step.selector, timeout);
    
    if (!element) {
      throw new Error(`Elemento no encontrado: ${step.selector}`);
    }

    // Verificar que sea un input
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
      throw new Error(`Elemento no es un input: ${step.selector}`);
    }

    // Hacer scroll al elemento si es necesario
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Focus en el elemento
    element.focus();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Limpiar el valor actual
    if (element instanceof HTMLInputElement) {
      simulateInput(element, '');
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Escribir el texto carácter por carácter para simular escritura real
    for (let i = 0; i < step.text.length; i++) {
      const char = step.text[i];
      if (element instanceof HTMLInputElement) {
        simulateInput(element, element.value + char);
      } else {
        element.value = element.value + char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Disparar evento blur para que se procese el valor
    element.blur();
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

/**
 * Ejecuta un paso de selección
 */
async function executeSelectStep(
  step: SelectStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  const timeout = step.timeout || 5000;
  
  try {
    const element = await waitForElement(step.selector, timeout);
    
    if (!element) {
      throw new Error(`Elemento no encontrado: ${step.selector}`);
    }

    if (!(element instanceof HTMLSelectElement)) {
      throw new Error(`Elemento no es un select: ${step.selector}`);
    }

    // Hacer scroll al elemento si es necesario
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 200));

    // Seleccionar el valor
    element.value = step.value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

/**
 * Ejecuta un paso de aserción
 */
async function executeAssertStep(
  step: AssertStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  const timeout = step.timeout || 5000;
  
  try {
    const element = await waitForElement(step.selector, timeout);
    
    if (!element) {
      throw new Error(`Elemento no encontrado: ${step.selector}`);
    }

    const text = element.textContent || element.innerText || '';

    if (step.contains !== undefined) {
      if (!text.includes(step.contains)) {
        throw new Error(`El elemento no contiene "${step.contains}". Texto encontrado: "${text}"`);
      }
    }

    if (step.equals !== undefined) {
      if (text.trim() !== step.equals.trim()) {
        throw new Error(`El elemento no es igual a "${step.equals}". Texto encontrado: "${text}"`);
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

/**
 * Ejecuta un paso de espera
 */
async function executeWaitForStep(
  step: WaitForStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  const timeout = step.timeout || 5000;
  
  try {
    await waitForElement(step.selector, timeout);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    // No lanzar error, solo registrar warning
    console.warn(`Warning: No se encontró el elemento después del timeout: ${step.selector}`);
  }
}

/**
 * Ejecuta un paso de mensaje
 */
async function executeSayStep(
  step: SayStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  const duration = step.duration || 2000;
  callbacks.onMessage?.(step.message);
  await new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Ejecuta un paso individual del script
 */
export async function executeStep(
  step: DemoStep,
  callbacks: DemoRunnerCallbacks
): Promise<void> {
  switch (step.type) {
    case 'navigate':
      await executeNavigateStep(step, callbacks);
      break;
    case 'click':
      await executeClickStep(step, callbacks);
      break;
    case 'type':
      await executeTypeStep(step, callbacks);
      break;
    case 'select':
      await executeSelectStep(step, callbacks);
      break;
    case 'assert':
      await executeAssertStep(step, callbacks);
      break;
    case 'waitFor':
      await executeWaitForStep(step, callbacks);
      break;
    case 'say':
      await executeSayStep(step, callbacks);
      break;
    default:
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = step;
      void _exhaustive; // Marcar como usado intencionalmente
      throw new Error(`Tipo de paso desconocido: ${(step as any).type}`);
  }
}

/**
 * Ejecuta un script completo
 */
export async function executeScript(
  steps: DemoStep[],
  callbacks: DemoRunnerCallbacks,
  speed: 'normal' | 'fast' = 'normal',
  onStepComplete?: (stepIndex: number) => void,
  shouldStop?: () => boolean,
  shouldPause?: () => boolean
): Promise<void> {
  const delayBetweenSteps = speed === 'fast' ? 200 : 1000;

  for (let i = 0; i < steps.length; i++) {
    // Verificar si debe detenerse
    if (shouldStop?.()) {
      break;
    }

    // Esperar si está pausado
    while (shouldPause?.()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verificar nuevamente después de pausar
    if (shouldStop?.()) {
      break;
    }

    try {
      await executeStep(steps[i], callbacks);
      onStepComplete?.(i);
      
      // Esperar antes del siguiente paso (excepto en el último)
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenSteps));
      }
    } catch (error) {
      // Registrar error pero continuar con el siguiente paso
      console.error(`Error ejecutando paso ${i + 1}:`, error);
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Continuar con el siguiente paso después de un delay
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenSteps));
      }
    }
  }
}
