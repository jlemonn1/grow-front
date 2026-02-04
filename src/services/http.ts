import type { ApiError, ValidationError } from '@/types/api';
import { getApiBaseUrl } from '@/utils/apiUrl';

// Obtener la URL base de la API desde variables de entorno
const BASE_URL = getApiBaseUrl();

/**
 * Obtiene el token JWT del localStorage
 */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Verifica si está en modo visitante
 */
function isVisitorMode(): boolean {
  return localStorage.getItem('growshop_visitor_mode') === 'true';
}

/**
 * Verifica si el endpoint es público
 */
function isPublicEndpoint(endpoint: string): boolean {
  return endpoint.startsWith('/public/');
}

/**
 * Construye los headers para las requests
 */
function getHeaders(endpoint?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // No incluir token si es endpoint público o si está en modo visitante
  const shouldIncludeToken = !isPublicEndpoint(endpoint || '') && !isVisitorMode();
  
  if (shouldIncludeToken) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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
    // Limpiar token inválido y datos de usuario
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isMainAdmin');
    
    // Disparar evento personalizado para que el contexto de auth maneje el logout
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    
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
  // Si el endpoint ya es una URL completa, usarla tal cual
  // Si no, construirla con BASE_URL
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(endpoint),
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
 * POST request with FormData (for file uploads)
 */
export async function postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const baseHeaders = getHeaders(endpoint) as Record<string, string>;
  // Create new headers object without Content-Type to let browser set it with boundary for multipart/form-data
  const headers: Record<string, string> = {};
  
  // Copy all headers except Content-Type
  Object.entries(baseHeaders).forEach(([key, value]) => {
    if (key.toLowerCase() !== 'content-type') {
      headers[key] = value;
    }
  });
  
  return request<T>(endpoint, {
    method: 'POST',
    body: formData,
    headers,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request with FormData (for file uploads)
 */
export async function putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const baseHeaders = getHeaders(endpoint) as Record<string, string>;
  // Create new headers object without Content-Type to let browser set it with boundary for multipart/form-data
  const headers: Record<string, string> = {};
  
  // Copy all headers except Content-Type
  Object.entries(baseHeaders).forEach(([key, value]) => {
    if (key.toLowerCase() !== 'content-type') {
      headers[key] = value;
    }
  });
  
  return request<T>(endpoint, {
    method: 'PUT',
    body: formData,
    headers,
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
