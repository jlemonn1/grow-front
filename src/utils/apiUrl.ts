/**
 * Utilidades para construir URLs de la API y recursos desde variables de entorno
 * 
 * Todas las URLs se obtienen desde variables de entorno para evitar valores hardcodeados.
 * Las variables deben estar definidas en el archivo .env o .env.local
 */

/**
 * Obtiene la URL base de la API desde variables de entorno
 * Ejemplo: http://localhost:8080/api/v1
 * 
 * @throws Error si VITE_API_URL no está definida
 */
export function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error(
      'VITE_API_URL no está definida. Por favor, configura esta variable en tu archivo .env o .env.local'
    );
  }
  
  return apiUrl;
}

/**
 * Obtiene la URL base del servidor (sin /api/v1)
 * Ejemplo: http://localhost:8080
 * 
 * Útil para construir URLs de recursos estáticos como imágenes
 * 
 * Si VITE_SERVER_URL está definida, se usa esa. Si no, se deriva de VITE_API_URL.
 * 
 * @throws Error si VITE_API_URL no está definida
 */
export function getServerBaseUrl(): string {
  // Si VITE_SERVER_URL está definida, usarla directamente
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  if (serverUrl) {
    return serverUrl;
  }
  
  // Si no, derivarla de VITE_API_URL
  const apiUrl = getApiBaseUrl();
  
  // Remover /api/v1 del final si existe
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

/**
 * Construye una URL completa para un endpoint de la API
 * 
 * @param endpoint - Endpoint relativo (ej: '/admins/me')
 * @returns URL completa (ej: 'http://localhost:8080/api/v1/admins/me')
 * 
 * @throws Error si VITE_API_URL no está definida
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Construye una URL completa para un recurso estático (imágenes, logos, etc.)
 * 
 * @param resourcePath - Ruta relativa del recurso (ej: '/images/logo.png')
 * @returns URL completa (ej: 'http://localhost:8080/images/logo.png')
 * 
 * Si el resourcePath ya es una URL completa (empieza con http:// o https://),
 * se devuelve tal cual.
 * 
 * @throws Error si VITE_API_URL no está definida
 */
export function buildResourceUrl(resourcePath: string): string {
  // Si ya es una URL completa, devolverla tal cual
  if (resourcePath.startsWith('http://') || resourcePath.startsWith('https://')) {
    return resourcePath;
  }
  
  const serverBaseUrl = getServerBaseUrl();
  const cleanPath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  return `${serverBaseUrl}${cleanPath}`;
}
