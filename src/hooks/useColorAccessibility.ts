import { useEffect } from 'react';
import { useAuth } from '@/context/auth.context';

type ColorAccessibilityMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'high-contrast';

// Paletas de colores para cada modo de accesibilidad
const accessibilityPalettes: Record<ColorAccessibilityMode, Record<string, string>> = {
  normal: {}, // No aplica cambios, usa el sistema del growshop
  
  protanopia: {
    // No distingue rojo - usar azul/amarillo
    '--color-primary': '#3b82f6',
    '--color-primary-dark': '#2563eb',
    '--color-primary-light': '#60a5fa',
    '--color-primary-rgb': '59, 130, 246',
    '--color-error': '#1e40af',
    '--color-error-rgb': '30, 64, 175',
    '--color-success': '#d97706',
    '--color-success-rgb': '217, 119, 6',
    '--color-warning': '#c2410c',
    '--color-warning-rgb': '194, 65, 12',
    '--color-info': '#7c3aed',
    '--color-info-rgb': '124, 58, 237',
  },
  
  deuteranopia: {
    // No distingue verde - usar azul/naranja
    '--color-primary': '#0ea5e9',
    '--color-primary-dark': '#0284c7',
    '--color-primary-light': '#38bdf8',
    '--color-primary-rgb': '14, 165, 233',
    '--color-error': '#ea580c',
    '--color-error-rgb': '234, 88, 12',
    '--color-success': '#2563eb',
    '--color-success-rgb': '37, 99, 235',
    '--color-warning': '#a16207',
    '--color-warning-rgb': '161, 98, 7',
    '--color-info': '#db2777',
    '--color-info-rgb': '219, 39, 119',
  },
  
  tritanopia: {
    // No distingue azul - usar rojo/verde
    '--color-primary': '#10b981',
    '--color-primary-dark': '#059669',
    '--color-primary-light': '#34d399',
    '--color-primary-rgb': '16, 185, 129',
    '--color-error': '#dc2626',
    '--color-error-rgb': '220, 38, 38',
    '--color-success': '#15803d',
    '--color-success-rgb': '21, 128, 61',
    '--color-warning': '#e11d48',
    '--color-warning-rgb': '225, 29, 72',
    '--color-info': '#14b8a6',
    '--color-info-rgb': '20, 184, 166',
  },
  
  'high-contrast': {
    // Alto contraste
    '--color-primary': '#ffffff',
    '--color-primary-dark': '#e0e0e0',
    '--color-primary-light': '#ffffff',
    '--color-primary-rgb': '255, 255, 255',
    '--color-error': '#ff0000',
    '--color-error-rgb': '255, 0, 0',
    '--color-success': '#00ff00',
    '--color-success-rgb': '0, 255, 0',
    '--color-warning': '#ffff00',
    '--color-warning-rgb': '255, 255, 0',
    '--color-info': '#00ffff',
    '--color-info-rgb': '0, 255, 255',
  },
};

const allColorVars = [
  '--color-primary', '--color-primary-dark', '--color-primary-light', '--color-primary-rgb',
  '--color-error', '--color-error-rgb',
  '--color-success', '--color-success-rgb',
  '--color-warning', '--color-warning-rgb',
  '--color-info', '--color-info-rgb',
];

/**
 * Normaliza el valor de accesibilidad de color del backend al formato esperado.
 */
function normalizeColorAccessibility(value: string | undefined): ColorAccessibilityMode {
  if (!value) return 'normal';

  const normalized = value.toLowerCase().replace(/_/g, '-');

  const validModes: ColorAccessibilityMode[] = ['protanopia', 'deuteranopia', 'tritanopia', 'high-contrast'];
  if (validModes.includes(normalized as ColorAccessibilityMode)) {
    return normalized as ColorAccessibilityMode;
  }

  return 'normal';
}

/**
 * Hook que aplica el modo de accesibilidad de color del admin actual.
 * Usa style.setProperty() para igualar la especificidad con applyColorSystem.
 */
export function useColorAccessibility() {
  const { currentAdmin } = useAuth();

  useEffect(() => {
    const mode = normalizeColorAccessibility(currentAdmin?.colorAccessibility);
    const root = document.documentElement;
    
    console.log('[useColorAccessibility] Aplicando modo:', mode, 'Valor raw:', currentAdmin?.colorAccessibility);
    
    // Aplicar atributo para CSS
    root.setAttribute('data-color-accessibility', mode);
    
    if (mode === 'normal') {
      // Modo normal: limpiar inline styles y dejar que el sistema del growshop controle los colores
      allColorVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
      console.log('[useColorAccessibility] Modo normal: colores delegados al sistema del growshop');
      // Disparar evento para que el config context reaplique los colores del growshop
      window.dispatchEvent(new CustomEvent('color-accessibility:normal'));
    } else {
      // Modo accesibilidad: aplicar colores con alta especificidad via inline styles
      const palette = accessibilityPalettes[mode];
      Object.entries(palette).forEach(([varName, value]) => {
        root.style.setProperty(varName, value);
      });
      console.log('[useColorAccessibility] Modo', mode, 'aplicado con colores:', palette['--color-primary']);
    }
    
    // Limpiar al desmontar
    return () => {
      root.setAttribute('data-color-accessibility', 'normal');
      allColorVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
    };
  }, [currentAdmin]);

  const mode = normalizeColorAccessibility(currentAdmin?.colorAccessibility);

  return {
    mode,
    isAccessibilityMode: mode !== 'normal',
  };
}
