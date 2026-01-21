/**
 * Formatea un número como moneda en formato "€XX.XX"
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parsea un string de dinero a número
 * Elimina símbolos de moneda y espacios
 */
export function parseMoney(value: string): number {
  const cleaned = value.replace(/[€\s]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
