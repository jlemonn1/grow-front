/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL base de la API del backend (incluye /api/v1)
   * Ejemplo: http://localhost:8080/api/v1
   */
  readonly VITE_API_URL: string;
  
  /**
   * URL base del servidor (sin /api/v1) - Opcional
   * Si no se define, se deriva automáticamente de VITE_API_URL
   */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
