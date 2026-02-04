import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { configService, type GrowConfiguration, type UpdateGrowConfigurationRequest } from '@/services/config.service';
import { generateColorPalette, applyColorSystem } from '@/utils/colorSystem';
import { hasToken } from '@/services/auth.service';

type QuickSaleMode = 'modal' | 'redirect';

interface ConfigContextValue {
  config: GrowConfiguration | null;
  loading: boolean;
  error: string | null;
  themeMode: 'light' | 'dark';
  quickSaleMode: QuickSaleMode;
  needsOnboarding: boolean;
  needsFunctionalOnboarding: boolean;
  completeFunctionalOnboarding: () => void;
  updateConfiguration: (data: UpdateGrowConfigurationRequest) => Promise<void>;
  refreshConfiguration: () => Promise<void>;
  applyColorTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setQuickSaleMode: (mode: QuickSaleMode) => void;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);
const QUICK_SALE_MODE_KEY = 'growshop_quick_sale_mode';

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
 * Obtiene el modo de venta rápida desde localStorage
 */
function getInitialQuickSaleMode(): QuickSaleMode {
  const saved = localStorage.getItem(QUICK_SALE_MODE_KEY);
  return (saved === 'redirect' || saved === 'modal') ? saved : 'modal';
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
  const [quickSaleMode, setQuickSaleModeState] = useState<QuickSaleMode>(getInitialQuickSaleMode);
  const [functionalOnboardingCompleted, setFunctionalOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('functional-onboarding-completed') === 'true';
  });

  const loadConfiguration = useCallback(async () => {
    // Solo cargar configuración si hay token
    if (!hasToken()) {
      setLoading(false);
      setConfig(null);
      return;
    }

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

  const handleSetQuickSaleMode = useCallback((mode: QuickSaleMode) => {
    localStorage.setItem(QUICK_SALE_MODE_KEY, mode);
    setQuickSaleModeState(mode);
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

  // Cargar configuración al montar solo si hay token
  useEffect(() => {
    if (hasToken()) {
      loadConfiguration();
    } else {
      setLoading(false);
      setConfig(null);
    }
  }, [loadConfiguration]);

  // Escuchar cambios en el token (cuando se hace login/logout)
  // Solo verificar cuando no hay config cargada pero podría haber token
  useEffect(() => {
    // Si ya hay config cargada, no necesitamos verificar cambios en el token
    if (config) return;

    const checkTokenAndLoad = () => {
      if (hasToken()) {
        // Si hay token y no hay config cargada, cargar configuración
        loadConfiguration();
      } else {
        // Si no hay token, asegurar que loading esté en false
        setLoading(false);
      }
    };

    // Verificar periódicamente si cambió el token (solo cuando no hay config)
    // Esto es necesario porque localStorage no dispara eventos en la misma pestaña
    // Usamos un intervalo más largo para no ser demasiado agresivo
    const interval = setInterval(() => {
      checkTokenAndLoad();
    }, 2000);

    // También escuchar eventos de storage (para cambios desde otras pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkTokenAndLoad();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [config, loadConfiguration]);

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

  // Escuchar cambios en el modo de venta rápida desde localStorage (otras pestañas o cambios directos)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === QUICK_SALE_MODE_KEY && e.newValue) {
        const newMode = (e.newValue === 'redirect' || e.newValue === 'modal') ? e.newValue : 'modal';
        setQuickSaleModeState(newMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Función para determinar si se necesita onboarding funcional (tour)
  const needsFunctionalOnboarding = useCallback((): boolean => {
    // Si no hay token, no se necesita onboarding
    if (!hasToken()) return false;
    
    // Usar el estado local en lugar de leer directamente del localStorage
    return !functionalOnboardingCompleted;
  }, [functionalOnboardingCompleted]);

  // Función para marcar el onboarding funcional como completado
  const completeFunctionalOnboarding = useCallback(() => {
    localStorage.setItem('functional-onboarding-completed', 'true');
    setFunctionalOnboardingCompleted(true);
  }, []);


  // Función para determinar si se necesita onboarding de configuración
  // Solo se evalúa si hay token (usuario autenticado)
  const needsOnboarding = useCallback((): boolean => {
    // Si no hay token, no se necesita onboarding
    if (!hasToken()) return false;
    
    // Si está cargando o no hay configuración, no se necesita onboarding aún
    if (!config || loading) return false;
    
    // Onboarding necesario si:
    // - Logo vacío (null) O
    // - Nombre vacío O nombre es "Growshop"
    const hasEmptyLogo = config.logoUrl === null;
    const hasEmptyOrDefaultName = !config.growName || config.growName.trim() === '' || config.growName === 'Growshop';
    
    return hasEmptyLogo || hasEmptyOrDefaultName;
  }, [config, loading]);

  const value: ConfigContextValue = {
    config,
    loading,
    error,
    themeMode,
    quickSaleMode,
    needsOnboarding: needsOnboarding(),
    needsFunctionalOnboarding: needsFunctionalOnboarding(),
    completeFunctionalOnboarding,
    updateConfiguration,
    refreshConfiguration,
    applyColorTheme,
    setThemeMode: handleSetThemeMode,
    setQuickSaleMode: handleSetQuickSaleMode,
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
