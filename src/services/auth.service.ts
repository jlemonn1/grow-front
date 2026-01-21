import { post } from './http';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  isMainAdmin: boolean;
  requiresRegistration?: boolean;
}

export interface RegisterMainAdminRequest {
  username: string;
  password: string;
}

/**
 * Realiza login y guarda el token en localStorage junto con la información del usuario
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  try {
    const response = await post<AuthResponse>('/auth/login', { username, password });
    
    // Guardar token e información del usuario en localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      if (response.username) {
        localStorage.setItem('username', response.username);
      }
      if (response.isMainAdmin !== undefined) {
        localStorage.setItem('isMainAdmin', String(response.isMainAdmin));
      }
      return response;
    }
    
    throw new Error('No se recibió token en la respuesta');
  } catch (error: any) {
    // Verificar si el error indica que se requiere registro
    if (error?.status === 428 || error?.message?.includes('requiere registro')) {
      const registrationError: Error & { requiresRegistration?: boolean } = error;
      registrationError.requiresRegistration = true;
      throw registrationError;
    }
    throw error;
  }
}

/**
 * Registra el admin principal del sistema
 */
export async function registerMainAdmin(username: string, password: string): Promise<AuthResponse> {
  const response = await post<AuthResponse>('/auth/register', { username, password });
  
  // Guardar token e información del usuario en localStorage
  if (response.token) {
    localStorage.setItem('token', response.token);
    if (response.username) {
      localStorage.setItem('username', response.username);
    }
    if (response.isMainAdmin !== undefined) {
      localStorage.setItem('isMainAdmin', String(response.isMainAdmin));
    }
    return response;
  }
  
  throw new Error('No se recibió token en la respuesta');
}

/**
 * Verifica si hay un token guardado
 */
export function hasToken(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * Obtiene el token guardado
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Obtiene el username del usuario actual
 */
export function getCurrentUsername(): string | null {
  return localStorage.getItem('username');
}

/**
 * Verifica si el usuario actual es admin principal
 */
export function isMainAdmin(): boolean {
  return localStorage.getItem('isMainAdmin') === 'true';
}

/**
 * Obtiene la información del usuario actual desde localStorage
 */
export function getCurrentUser(): { username: string; isMainAdmin: boolean } | null {
  const username = getCurrentUsername();
  if (!username) {
    return null;
  }
  return {
    username,
    isMainAdmin: isMainAdmin(),
  };
}

/**
 * Elimina el token y la información del usuario (logout)
 */
export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('isMainAdmin');
}
