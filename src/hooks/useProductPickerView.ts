import { useState, useCallback, useEffect } from 'react';

export type ProductPickerViewMode = 'folders' | 'list';

const STORAGE_KEY = 'product-picker-view-mode';

/**
 * Hook para manejar la preferencia de vista del ProductPicker.
 * Persiste la selección en localStorage para que se mantenga entre sesiones
 * y recargas de página de la forma más fuerte posible en el dispositivo.
 */
export function useProductPickerView(defaultMode: ProductPickerViewMode = 'list') {
  const [viewMode, setViewModeState] = useState<ProductPickerViewMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'list' || stored === 'folders') {
        return stored;
      }
    } catch {
      // Ignorar errores de localStorage
    }
    return defaultMode;
  });

  const setViewMode = useCallback((mode: ProductPickerViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'folders' ? 'list' : 'folders');
  }, [viewMode, setViewMode]);

  // Escuchar cambios en localStorage desde otras pestañas
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue === 'list' || e.newValue === 'folders') {
          setViewModeState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isListMode = viewMode === 'list';
  const isFoldersMode = viewMode === 'folders';

  return { viewMode, setViewMode, toggleViewMode, isListMode, isFoldersMode };
}
