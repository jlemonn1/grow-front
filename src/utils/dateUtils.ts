export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getFirstDayOfMonthISO(): string {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

export function getFirstDayOfMonthISOFrom(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toISOString().split('T')[0];
}

export function getLastDayOfMonthISO(year: number, month: number): string {
  const date = new Date(year, month, 0);
  return date.toISOString().split('T')[0];
}

export function getMonthName(monthIndex: number): string {
  const names = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return names[monthIndex - 1] || '';
}

export function getShortMonthName(monthIndex: number): string {
  const names = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  return names[monthIndex - 1] || '';
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/**
 * Parsea una fecha ISO (YYYY-MM-DD) extrayendo año, mes y día
 * SIN interpretarla como UTC. Evita bugs de timezone.
 */
export function parseISODateLocal(dateString: string): { year: number; month: number; day: number } {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  return {
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
  };
}
