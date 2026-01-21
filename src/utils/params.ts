/**
 * Compara dos objetos de parámetros para ver si son iguales
 * Útil para evitar recargas innecesarias
 */
export function areParamsEqual<T extends Record<string, any>>(
  params1: T | null | undefined,
  params2: T | null | undefined
): boolean {
  if (params1 === params2) return true;
  if (!params1 || !params2) return false;

  const keys1 = Object.keys(params1).sort();
  const keys2 = Object.keys(params2).sort();

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    const val1 = params1[key];
    const val2 = params2[key];

    // Comparación especial para fechas
    if (val1 instanceof Date && val2 instanceof Date) {
      if (val1.getTime() !== val2.getTime()) return false;
      continue;
    }

    // Comparación especial para objetos
    if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
      if (!areParamsEqual(val1, val2)) return false;
      continue;
    }

    if (val1 !== val2) return false;
  }

  return true;
}

/**
 * Valida un rango de fechas
 */
export function validateDateRange(
  from: Date | string | null | undefined,
  to: Date | string | null | undefined
): { valid: boolean; error?: string } {
  if (!from || !to) {
    return { valid: true }; // Rangos vacíos son válidos
  }

  const fromDate = typeof from === 'string' ? new Date(from) : from;
  const toDate = typeof to === 'string' ? new Date(to) : to;

  if (isNaN(fromDate.getTime())) {
    return { valid: false, error: 'Fecha inicial inválida' };
  }

  if (isNaN(toDate.getTime())) {
    return { valid: false, error: 'Fecha final inválida' };
  }

  if (fromDate > toDate) {
    return { valid: false, error: 'La fecha inicial no puede ser posterior a la fecha final' };
  }

  return { valid: true };
}
