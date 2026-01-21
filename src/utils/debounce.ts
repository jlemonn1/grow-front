/**
 * Crea una función con debounce que retrasa la ejecución
 * hasta que haya pasado un tiempo sin invocarse
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Crea una función con debounce que retorna una promesa
 * Útil para operaciones asíncronas
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastPromise: Promise<ReturnType<T>> | null = null;

  return function debounced(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          lastPromise = Promise.resolve(result);
          resolve(result);
        } catch (error) {
          lastPromise = null;
          reject(error);
        }
      }, wait);
    });
  };
}
