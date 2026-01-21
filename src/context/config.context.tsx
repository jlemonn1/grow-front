import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { configService, type GrowConfiguration, type UpdateGrowConfigurationRequest } from '@/services/config.service';
import { generateColorPalette, applyColorSystem } from '@/utils/colorSystem';

interface ConfigContextValue {
  config: GrowConfiguration | null;
  loading: boolean;
  error: string | null;
  themeMode: 'light' | 'dark';
  updateConfiguration: (data: UpdateGrowConfigurationRequest) => Promise<void>;
  refreshConfiguration: () => Promise<void>;
  applyColorTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

/**
 * Obtiene el tema del sistema o del localStorage
 */
function getInitialTheme(): 'light' | 'dark' {
  // Verificar localStorage primero
  const savedTheme = localStorage.getItem('theme-mode');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  // Detectar tema del sistema
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  // Por defecto: modo claro
  return 'light';
}

/**
 * Establece el tema en el documento HTML
 */
function setThemeMode(mode: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme-mode', mode);
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<GrowConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(getInitialTheme);

  const loadConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const configuration = await configService.getConfiguration();
      setConfig(configuration);
      // Aplicar colores automáticamente al cargar
      if (configuration.primaryColor) {
        const palette = generateColorPalette(configuration.primaryColor);
        applyColorSystem(palette);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar configuración';
      setError(errorMessage);
      // Usar valores por defecto si hay error
      const defaultConfig = {
        id: '',
        growName: 'Growshop',
        logoUrl: null,
        primaryColor: '#3bd420',
        showCashDetails: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConfig(defaultConfig);
      // Aplicar colores por defecto
      const palette = generateColorPalette(defaultConfig.primaryColor);
      applyColorSystem(palette);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfiguration = useCallback(async (data: UpdateGrowConfigurationRequest): Promise<void> => {
    try {
      setError(null);
      const updatedConfig = await configService.updateConfiguration(data);
      setConfig(updatedConfig);
      // Aplicar colores automáticamente al actualizar
      if (updatedConfig.primaryColor) {
        const palette = generateColorPalette(updatedConfig.primaryColor);
        applyColorSystem(palette);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshConfiguration = useCallback(async () => {
    await loadConfiguration();
  }, [loadConfiguration]);

  const applyColorTheme = useCallback(() => {
    if (config?.primaryColor) {
      const palette = generateColorPalette(config.primaryColor);
      applyColorSystem(palette);
    }
  }, [config]);

  const handleSetThemeMode = useCallback((mode: 'light' | 'dark') => {
    setThemeModeState(mode);
    setThemeMode(mode);
  }, []);

  // Establecer tema inicial al montar
  useEffect(() => {
    setThemeMode(themeMode);
  }, []);

  // Aplicar colores cuando cambia primaryColor
  useEffect(() => {
    if (config?.primaryColor) {
      const palette = generateColorPalette(config.primaryColor);
      applyColorSystem(palette);
    }
  }, [config?.primaryColor]);

  // Cargar configuración al montar
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  // Escuchar cambios del tema del sistema
  useEffect(() => {
    if (!localStorage.getItem('theme-mode')) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeModeState(newTheme);
        setThemeMode(newTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const value: ConfigContextValue = {
    config,
    loading,
    error,
    themeMode,
    updateConfiguration,
    refreshConfiguration,
    applyColorTheme,
    setThemeMode: handleSetThemeMode,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig debe usarse dentro de ConfigProvider');
  }
  return context;
}
