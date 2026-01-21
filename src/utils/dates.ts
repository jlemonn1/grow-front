/**
 * Formatea una fecha a formato "DD/MM/YYYY"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha con hora a formato "DD/MM/YYYY HH:mm"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Parsea un rango de fechas desde strings
 */
export function parseDateRange(from: string, to: string): { from: Date; to: Date } {
  return {
    from: new Date(from),
    to: new Date(to),
  };
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a ISO_DATE_TIME (YYYY-MM-DDTHH:mm:ss)
 * Si no se proporciona hora, usa 00:00:00 para "from" y 23:59:59 para "to"
 */
export function dateToISO(dateString: string, isEndOfDay: boolean = false): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (isEndOfDay) {
    return `${year}-${month}-${day}T23:59:59`;
  }
  return `${year}-${month}-${day}T00:00:00`;
}

export type PredefinedPeriod = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year';

export interface DateRange {
  from: string; // ISO date string (YYYY-MM-DD)
  to: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Calcula un período predefinido y retorna el rango de fechas
 */
export function getPredefinedPeriod(period: PredefinedPeriod): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let from: Date;
  let to: Date;

  switch (period) {
    case 'today': {
      from = new Date(today);
      to = new Date(today);
      break;
    }
    case 'yesterday': {
      from = new Date(today);
      from.setDate(from.getDate() - 1);
      to = new Date(from);
      break;
    }
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunes
      from = new Date(today.setDate(diff));
      today.setHours(0, 0, 0, 0);
      to = new Date(today);
      break;
    }
    case 'last_week': {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunes
      const thisWeekMonday = new Date(today.setDate(diff));
      thisWeekMonday.setHours(0, 0, 0, 0);
      to = new Date(thisWeekMonday);
      to.setDate(to.getDate() - 1); // Domingo anterior
      from = new Date(to);
      from.setDate(from.getDate() - 6); // Lunes anterior
      break;
    }
    case 'this_month': {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today);
      break;
    }
    case 'last_month': {
      const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(firstDayThisMonth);
      to.setDate(to.getDate() - 1);
      from = new Date(to.getFullYear(), to.getMonth(), 1);
      break;
    }
    case 'this_year': {
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today);
      break;
    }
    case 'last_year': {
      const lastYear = today.getFullYear() - 1;
      from = new Date(lastYear, 0, 1);
      to = new Date(lastYear, 11, 31);
      break;
    }
    default: {
      from = new Date(today);
      to = new Date(today);
    }
  }

  return {
    from: formatDateForInput(from),
    to: formatDateForInput(to),
  };
}

/**
 * Formatea una fecha para usar en input type="date" (YYYY-MM-DD)
 */
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula el período equivalente anterior basado en la duración del período actual
 */
export function getPreviousPeriod(currentRange: DateRange): DateRange {
  const from = new Date(currentRange.from);
  const to = new Date(currentRange.to);
  
  const durationDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousTo = new Date(from);
  previousTo.setDate(previousTo.getDate() - 1);
  
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - durationDays);
  
  return {
    from: formatDateForInput(previousFrom),
    to: formatDateForInput(previousTo),
  };
}

/**
 * Formatea un período en texto legible
 */
export function formatPeriodLabel(range: DateRange | null): string {
  if (!range) return 'Todos los períodos';
  
  const fromDate = formatDate(range.from);
  const toDate = formatDate(range.to);
  
  if (range.from === range.to) {
    return fromDate;
  }
  
  return `${fromDate} - ${toDate}`;
}

/**
 * Obtiene el nombre del período predefinido si coincide con algún período conocido
 */
export function getPeriodName(range: DateRange | null): string | null {
  if (!range) return null;
  
  const predefinedPeriods: PredefinedPeriod[] = [
    'today', 'yesterday', 'this_week', 'last_week',
    'this_month', 'last_month', 'this_year', 'last_year'
  ];
  
  for (const period of predefinedPeriods) {
    const predefined = getPredefinedPeriod(period);
    if (predefined.from === range.from && predefined.to === range.to) {
      return period;
    }
  }
  
  return null;
}