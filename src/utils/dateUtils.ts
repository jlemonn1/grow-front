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
