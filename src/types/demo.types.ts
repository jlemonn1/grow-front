/**
 * Tipos para el sistema de scripts de demostración (DemoRunner)
 */

/**
 * Velocidad de ejecución del demo
 * - normal: 1000ms entre pasos
 * - fast: 200ms entre pasos
 */
export type DemoSpeed = 'normal' | 'fast';

/**
 * Paso de navegación: cambia la ruta de la aplicación
 */
export interface NavigateStep {
  type: 'navigate';
  route: string;
}

/**
 * Paso de click: hace click en un elemento
 */
export interface ClickStep {
  type: 'click';
  selector: string;
  timeout?: number; // Timeout en ms (default: 5000)
}

/**
 * Paso de escritura: escribe texto en un input
 */
export interface TypeStep {
  type: 'type';
  selector: string;
  text: string;
  timeout?: number; // Timeout en ms (default: 5000)
}

/**
 * Paso de selección: selecciona una opción en un select
 */
export interface SelectStep {
  type: 'select';
  selector: string;
  value: string;
  timeout?: number; // Timeout en ms (default: 5000)
}

/**
 * Paso de aserción: verifica una condición en un elemento
 */
export interface AssertStep {
  type: 'assert';
  selector: string;
  contains?: string; // Verifica que el texto contenga este string
  equals?: string; // Verifica que el texto sea exactamente este string
  timeout?: number; // Timeout en ms (default: 5000)
}

/**
 * Paso de espera: espera a que un elemento aparezca en el DOM
 */
export interface WaitForStep {
  type: 'waitFor';
  selector: string;
  timeout?: number; // Timeout en ms (default: 5000)
}

/**
 * Paso de mensaje: muestra un mensaje al usuario
 */
export interface SayStep {
  type: 'say';
  message: string;
  duration?: number; // Duración en ms que se muestra el mensaje (default: 2000)
}

/**
 * Union type de todos los tipos de pasos posibles
 */
export type DemoStep =
  | NavigateStep
  | ClickStep
  | TypeStep
  | SelectStep
  | AssertStep
  | WaitForStep
  | SayStep;

/**
 * Script completo de demostración
 */
export interface DemoScript {
  name: string;
  description?: string;
  steps: DemoStep[];
}

/**
 * Estado del DemoRunner
 */
export interface DemoRunnerState {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  speed: DemoSpeed;
  currentMessage: string | null;
}