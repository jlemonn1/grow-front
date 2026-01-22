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
