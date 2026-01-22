import { post } from './http';

export interface PanicResponse {
  success: boolean;
  message: string;
  backupPath?: string;
  timestamp: string;
}

/**
 * Activa el modo pánico: crea un backup de la base de datos y borra todo excepto admins
 * ⚠️ OPERACIÓN IRREVERSIBLE - Solo para administradores
 */
export async function triggerPanicMode(): Promise<PanicResponse> {
  return post<PanicResponse>('/panic/clean');
}

/**
 * Activa el reset completo: crea un backup de la base de datos y vacía todas las tablas incluyendo admins y configuración
 * ⚠️ OPERACIÓN IRREVERSIBLE - Solo para administradores
 * Este método borra absolutamente todo, incluyendo admins y configuración
 */
export async function triggerCompleteReset(): Promise<PanicResponse> {
  return post<PanicResponse>('/panic/reset-complete');
}