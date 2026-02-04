/**
 * Utilidades para el sistema de demostración (DemoRunner)
 */

/**
 * Busca un elemento en el DOM usando un selector CSS o data-tour attribute
 * @param selector Selector CSS o data-tour attribute (ej: "[data-tour='nombre']" o "nombre")
 * @returns El elemento encontrado o null
 */
export function findElementByTour(selector: string): HTMLElement | null {
  try {
    // Si el selector ya es un selector CSS completo, usarlo directamente
    if (selector.startsWith('[') || selector.startsWith('.') || selector.startsWith('#')) {
      return document.querySelector(selector) as HTMLElement | null;
    }
    
    // Si no, asumir que es un data-tour attribute
    return document.querySelector(`[data-tour="${selector}"]`) as HTMLElement | null;
  } catch (error) {
    console.warn('Error buscando elemento:', selector, error);
    return null;
  }
}

/**
 * Espera a que un elemento aparezca en el DOM
 * @param selector Selector CSS o data-tour attribute
 * @param timeout Timeout en milisegundos (default: 5000)
 * @returns Promise que se resuelve cuando el elemento aparece o se rechaza si timeout
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    // Intentar encontrar el elemento inmediatamente
    const element = findElementByTour(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Si no está disponible, usar MutationObserver para detectar cuando aparece
    const observer = new MutationObserver(() => {
      const element = findElementByTour(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    });

    // Observar cambios en el DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout esperando elemento: ${selector}`));
    }, timeout);

    // También hacer polling cada 100ms como fallback
    const pollInterval = setInterval(() => {
      const element = findElementByTour(selector);
      if (element) {
        clearInterval(pollInterval);
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(element);
      }
    }, 100);

    // Limpiar interval al timeout
    setTimeout(() => {
      clearInterval(pollInterval);
    }, timeout);
  });
}

/**
 * Detecta si el modo demo está activo
 * @returns true si está en modo demo (por URL ?demo=1 o VITE_DEMO=true)
 */
export function detectDemoMode(): boolean {
  // Verificar parámetro en URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === '1') {
    return true;
  }

  // Verificar variable de entorno
  if (import.meta.env.VITE_DEMO === 'true') {
    return true;
  }

  return false;
}

/**
 * Simula un evento de teclado en un elemento
 * @param element Elemento donde simular el evento
 * @param key Tecla a simular
 */
export function simulateKeyPress(element: HTMLElement, key: string): void {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
}

/**
 * Simula un evento de input en un elemento
 * @param element Elemento input
 * @param value Valor a establecer
 */
export function simulateInput(element: HTMLInputElement, value: string): void {
  // Establecer el valor directamente
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Disparar eventos de input y change
  const inputEvent = new Event('input', { bubbles: true });
  const changeEvent = new Event('change', { bubbles: true });
  element.dispatchEvent(inputEvent);
  element.dispatchEvent(changeEvent);
}
