import type { ApiError, ApiResponse, ValidationError } from '@/types/api';

// Obtener la URL base de la API desde variables de entorno
// En desarrollo: VITE_API_URL o por defecto localhost:8080
// En producción: se debe configurar en Vercel como variable de entorno
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

/**
 * Obtiene el token JWT del localStorage
 */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Construye los headers para las requests
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Extrae información del producto del mensaje de error 409
 * Formato esperado: "Stock insuficiente para el producto 'Nombre'. Stock disponible: X, solicitado: Y"
 */
function extractProductInfoFrom409(message: string): { productName?: string; availableStock?: number; requestedStock?: number } {
  const productMatch = message.match(/producto\s+['"]([^'"]+)['"]/i);
  const availableMatch = message.match(/disponible:\s*([\d.]+)/i);
  const requestedMatch = message.match(/solicitado:\s*([\d.]+)/i);

  return {
    productName: productMatch ? productMatch[1] : undefined,
    availableStock: availableMatch ? parseFloat(availableMatch[1]) : undefined,
    requestedStock: requestedMatch ? parseFloat(requestedMatch[1]) : undefined,
  };
}

/**
 * Parsea fieldErrors del backend (puede venir en diferentes formatos)
 */
function parseFieldErrors(data: any): Record<string, string[]> | undefined {
  if (!data) return undefined;

  // Formato directo: { fieldErrors: { "field": ["error1", "error2"] } }
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    const parsed: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data.fieldErrors)) {
      if (Array.isArray(value)) {
        parsed[key] = value as string[];
      } else if (typeof value === 'string') {
        parsed[key] = [value];
      }
    }
    return parsed;
  }

  // Formato Spring: { errors: { "field": ["error1"] } }
  if (data.errors && typeof data.errors === 'object') {
    const parsed: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data.errors)) {
      if (Array.isArray(value)) {
        parsed[key] = value as string[];
      } else if (typeof value === 'string') {
        parsed[key] = [value];
      }
    }
    return parsed;
  }

  return undefined;
}

/**
 * Maneja errores HTTP y los convierte a tipos TypeScript
 */
async function handleError(response: Response): Promise<never> {
  let error: ApiError;

  try {
    const data = await response.json();
    const fieldErrors = parseFieldErrors(data);
    
    error = {
      message: data.message || 'Error desconocido',
      status: response.status,
      fieldErrors,
    };

    // Para errores 409, agregar información extraída del mensaje
    if (response.status === 409 && error.message) {
      const productInfo = extractProductInfoFrom409(error.message);
      (error as any).productInfo = productInfo;
    }
  } catch {
    error = {
      message: `Error ${response.status}: ${response.statusText}`,
      status: response.status,
    };
  }

  // Error de validación (422)
  if (response.status === 422 && error.fieldErrors) {
    throw error as ValidationError;
  }

  // Error de conflicto (409)
  if (response.status === 409) {
    throw error;
  }

  // Error no autorizado (401)
  if (response.status === 401) {
    // Limpiar token inválido
    localStorage.removeItem('token');
    throw error;
  }

  // Otros errores
  throw error;
}

// Callback para notificar cambios de estado de conexión
let connectionStatusCallback: ((isOnline: boolean) => void) | null = null;

export function setConnectionStatusCallback(callback: (isOnline: boolean) => void) {
  connectionStatusCallback = callback;
}

/**
 * Detecta si un error es de red (sin conexión)
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // TypeError generalmente indica problemas de red (fetch failed)
    return error.message.includes('fetch') || error.message.includes('network');
  }
  return false;
}

/**
 * Realiza una petición HTTP genérica
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    // Notificar que hay conexión
    if (connectionStatusCallback) {
      connectionStatusCallback(true);
    }

    if (!response.ok) {
      await handleError(response);
    }

    // Si la respuesta está vacía (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // Si no es JSON, devolver texto vacío o el texto de la respuesta
    return (await response.text()) as T;
  } catch (error) {
    // Detectar errores de red
    if (isNetworkError(error) || !navigator.onLine) {
      if (connectionStatusCallback) {
        connectionStatusCallback(false);
      }
      throw {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        status: 0,
        isNetworkError: true,
      } as ApiError & { isNetworkError: boolean };
    }
    throw error;
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function patch<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}
