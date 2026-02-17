/**
 * Utilidades para generar paleta de colores desde un color principal.
 * Sistema de colores neon futurista para diseño "fumon".
 */

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryAlpha: string;
  complement: string;
  neutralLight: string;
  neutralDark: string;
  // Colores neon
  neonPrimary: string;
  neonGlow: string;
  neonGlowIntense: string;
  neonBorder: string;
}

/**
 * Convierte un color hex a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convierte RGB a hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Obtiene la luminancia relativa de un color (WCAG)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula el contraste entre dos colores (WCAG)
 */
export function calculateContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Retorna el color de texto accesible (blanco o negro) según el contraste con el fondo
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = calculateContrast(backgroundColor, '#ffffff');
  const blackContrast = calculateContrast(backgroundColor, '#000000');
  
  // WCAG AA requiere mínimo 4.5:1 para texto normal
  // Preferir blanco si tiene mejor contraste, sino negro
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
}

/**
 * Determina si un color es claro basándose en su luminancia
 * @param color Color en formato hex (ej: '#ffffff' o 'ffffff')
 * @param threshold Umbral de luminancia (0-1). Por defecto 0.4
 * @returns true si el color es claro (luminancia > threshold)
 */
export function isLightColor(color: string, threshold: number = 0.4): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > threshold;
}

/**
 * Genera una variante más clara de un color
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));
  
  return rgbToHex(r, g, b);
}

/**
 * Genera una variante más oscura de un color
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = percent / 100;
  const r = Math.max(0, Math.round(rgb.r * (1 - factor)));
  const g = Math.max(0, Math.round(rgb.g * (1 - factor)));
  const b = Math.max(0, Math.round(rgb.b * (1 - factor)));
  
  return rgbToHex(r, g, b);
}

/**
 * Calcula el color complementario
 */
function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

/**
 * Aumenta la saturación de un color para efecto neon
 */
function saturateColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  // Convertir RGB a HSL para manipular saturación
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  // Aumentar saturación
  s = Math.min(1, s + (percent / 100));
  
  // Convertir HSL de vuelta a RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let newR, newG, newB;
  if (s === 0) {
    newR = newG = newB = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hue2rgb(p, q, h + 1/3);
    newG = hue2rgb(p, q, h);
    newB = hue2rgb(p, q, h - 1/3);
  }
  
  return rgbToHex(
    Math.round(newR * 255),
    Math.round(newG * 255),
    Math.round(newB * 255)
  );
}

/**
 * Genera colores para efectos glow neon
 */
function generateNeonGlow(baseColor: string): {
  neon: string;
  glow: string;
  glowIntense: string;
  border: string;
} {
  // Color neon: aumentar saturación 30-40%
  const neon = saturateColor(baseColor, 35);
  
  // Glow: mismo color con opacidad alfa para sombras
  const rgb = hexToRgb(neon);
  if (!rgb) {
    return {
      neon: baseColor,
      glow: baseColor + '4d', // 30% opacity
      glowIntense: baseColor + '80', // 50% opacity
      border: neon,
    };
  }
  
  // Glow suave (30% opacity)
  const glow = neon + '4d';
  // Glow intenso (50% opacity)
  const glowIntense = neon + '80';
  // Border LED: versión más brillante del neon
  const border = lightenColor(neon, 15);
  
  return {
    neon,
    glow,
    glowIntense,
    border,
  };
}

/**
 * Genera grises adaptados al color base
 */
function generateNeutralColors(baseColor: string): { light: string; dark: string } {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    return { light: '#f8fafc', dark: '#1e293b' };
  }
  
  // Calcular luminosidad promedio
  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  
  // Si el color es oscuro, usar grises más oscuros
  // Si es claro, usar grises más claros
  if (avg < 128) {
    return { light: '#475569', dark: '#0f172a' };
  } else {
    return { light: '#f1f5f9', dark: '#64748b' };
  }
}

/**
 * Genera una paleta completa de colores desde un color principal
 * Incluye colores neon intensificados para diseño futurista
 */
export function generateColorPalette(baseColor: string): ColorPalette {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    // Color por defecto si es inválido
    baseColor = '#3bd420';
  }
  
  // Generar colores neon
  const neonColors = generateNeonGlow(baseColor);
  
  const neutralColors = generateNeutralColors(baseColor);
  
  return {
    primary: baseColor,
    primaryLight: lightenColor(baseColor, 30),
    primaryDark: darkenColor(baseColor, 20),
    primaryAlpha: baseColor + '80', // 50% opacity en hex
    complement: getComplementaryColor(baseColor),
    neutralLight: neutralColors.light,
    neutralDark: neutralColors.dark,
    // Colores neon intensificados
    neonPrimary: neonColors.neon,
    neonGlow: neonColors.glow,
    neonGlowIntense: neonColors.glowIntense,
    neonBorder: neonColors.border,
  };
}

/**
 * Aplica el sistema de colores a las variables CSS del documento
 * Incluye aplicación de colores neon para efectos futuristas
 * También detecta si el color principal es claro e invierte automáticamente los colores
 * 
 * NOTA: Si hay un modo de accesibilidad de color activo (daltonismo), no aplica los colores
 * del growshop para no interferir con las paletas de accesibilidad.
 */
export function applyColorSystem(palette: ColorPalette): void {
  const root = document.documentElement;
  
  // Verificar si hay un modo de accesibilidad activo
  const accessibilityMode = root.getAttribute('data-color-accessibility');
  if (accessibilityMode && accessibilityMode !== 'normal') {
    console.log('[applyColorSystem] Modo de accesibilidad activo:', accessibilityMode, '- No se aplican colores del growshop');
    // Solo aplicar el atributo de color invertido si es necesario
    const isLight = isLightColor(palette.primary, 0.4);
    root.setAttribute('data-color-inverted', isLight ? 'true' : 'false');
    return;
  }
  
  // Extraer valores RGB del color primario para usar en rgba()
  const rgb = hexToRgb(palette.primary);
  if (rgb) {
    root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  } else {
    // Fallback: valores RGB del color por defecto (#3bd420 = rgb(59, 212, 32))
    root.style.setProperty('--color-primary-rgb', '59, 212, 32');
  }
  
  // Detectar si el color principal es claro y establecer atributo para inversión automática
  const isLight = isLightColor(palette.primary, 0.4);
  root.setAttribute('data-color-inverted', isLight ? 'true' : 'false');
  
  // Colores base
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-primary-light', palette.primaryLight);
  root.style.setProperty('--color-primary-dark', palette.primaryDark);
  root.style.setProperty('--color-complement', palette.complement);
  root.style.setProperty('--color-neutral-light', palette.neutralLight);
  root.style.setProperty('--color-neutral-dark', palette.neutralDark);
  
  // Colores neon
  root.style.setProperty('--neon-primary', palette.neonPrimary);
  root.style.setProperty('--neon-glow-primary', palette.neonGlow);
  root.style.setProperty('--neon-glow-intense', palette.neonGlowIntense);
  root.style.setProperty('--border-led-color', palette.neonBorder);
}
