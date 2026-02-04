/**
 * Denominaciones estándar de euros (billetes y monedas)
 */
export const STANDARD_DENOMINATIONS = [
  500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01
] as const;

/**
 * Obtiene el label para una denominación
 */
export function getDenominationLabel(value: number): string {
  if (value >= 1) {
    return `€${value}`;
  } else {
    return `${Math.round(value * 100)}c`;
  }
}

/**
 * Calcula el total de un mapa de denominaciones
 */
export function calculateTotal(denominations: Record<string, number>): number {
  let total = 0;
  for (const [key, quantity] of Object.entries(denominations)) {
    const value = parseFloat(key);
    if (!isNaN(value) && quantity > 0) {
      total += value * quantity;
    }
  }
  return total;
}
