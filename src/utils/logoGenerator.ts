/**
 * Generador de logos SVG para el onboarding
 * Crea logos con diferentes estilos (grafiti y retro) que incluyen el nombre del growshop
 */

export type LogoStyle = 'graffiti' | 'retro';
export type LogoVariant = 1 | 2;

/**
 * Genera un logo SVG según el estilo y variante especificados
 * @param style Estilo del logo ('graffiti' o 'retro')
 * @param variant Variante del estilo (1 o 2)
 * @param growName Nombre del growshop a incluir en el logo
 * @returns String con el SVG completo
 */
export function generateLogoSVG(
  style: LogoStyle,
  variant: LogoVariant,
  growName: string
): string {
  if (style === 'graffiti') {
    return variant === 1
      ? generateGraffitiLeaf(growName)
      : generateGraffitiMonkey(growName);
  } else {
    return variant === 1
      ? generateRetroPlant(growName)
      : generateRetroSymbol(growName);
  }
}

/**
 * Grafiti 1: Logo con hoja de marihuana estilizada - estilo grafitero fumón
 */
function generateGraffitiLeaf(growName: string): string {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="spray1">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
      </filter>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Efectos de spray paint de fondo (sin rectángulo de fondo) -->
    <circle cx="80" cy="80" r="40" fill="#ff0080" opacity="0.15" filter="url(#spray1)"/>
    <circle cx="320" cy="320" r="50" fill="#00ff80" opacity="0.15" filter="url(#spray1)"/>
    <circle cx="200" cy="200" r="35" fill="#8000ff" opacity="0.12" filter="url(#spray1)"/>
    <circle cx="350" cy="100" r="30" fill="#ff6b00" opacity="0.1" filter="url(#spray1)"/>
    <circle cx="50" cy="350" r="25" fill="#00d4ff" opacity="0.1" filter="url(#spray1)"/>
    
    <!-- Hoja de marihuana MUCHO más grande para ocupar más espacio -->
    <g transform="translate(200, 200)" filter="url(#glow)">
      <!-- Hoja principal mucho más grande (ratio casi 1:1) -->
      <path d="M 0,-80 Q -40,-100 -55,-70 Q -70,-30 -45,0 Q -55,40 -30,65 Q 0,80 30,65 Q 55,40 45,0 Q 70,-30 55,-70 Q 40,-100 0,-80 Z" 
            fill="#3bd420" opacity="0.95" stroke="#2ba015" stroke-width="3"/>
      <!-- Detalles de la hoja más marcados y grandes -->
      <path d="M -28,-40 Q -12,-55 0,-40 Q 12,-55 28,-40" stroke="#2ba015" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M -24,12 Q -11,0 0,12 Q 11,0 24,12" stroke="#2ba015" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M -16,40 Q 0,25 16,40" stroke="#2ba015" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Líneas de detalle internas más grandes -->
      <path d="M -20,-15 L -12,8 L -8,32" stroke="#2ba015" stroke-width="2.5" fill="none" opacity="0.7"/>
      <path d="M 20,-15 L 12,8 L 8,32" stroke="#2ba015" stroke-width="2.5" fill="none" opacity="0.7"/>
    </g>
    
    <!-- Nombre en estilo tag grafiti más grande y fumón -->
    <g transform="translate(200, 340)">
      <!-- Sombra del texto (efecto 3D grafiti) -->
      <text x="4" y="4" 
            font-family="Arial Black, Impact, sans-serif" 
            font-size="42" 
            font-weight="900"
            fill="#000000" 
            text-anchor="middle"
            opacity="0.4"
            style="letter-spacing: 3px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
      <!-- Texto principal con outline -->
      <text x="0" y="0" 
            font-family="Arial Black, Impact, sans-serif" 
            font-size="42" 
            font-weight="900"
            fill="#ffffff" 
            text-anchor="middle"
            stroke="#000000"
            stroke-width="1.5"
            style="letter-spacing: 3px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
      <!-- Highlight verde grafiti -->
      <text x="-1" y="-1" 
            font-family="Arial Black, Impact, sans-serif" 
            font-size="42" 
            font-weight="900"
            fill="#3bd420" 
            text-anchor="middle"
            opacity="0.8"
            style="letter-spacing: 3px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
    </g>
    
    <!-- Tags decorativos en las esquinas -->
    <g transform="translate(50, 50)">
      <path d="M 0,0 L 15,0 L 20,8 L 15,15 L 0,15 Z" fill="#3bd420" opacity="0.3"/>
      <text x="10" y="12" font-family="Arial" font-size="8" fill="#ffffff" text-anchor="middle" font-weight="bold">420</text>
    </g>
    <g transform="translate(330, 330)">
      <path d="M 0,0 L 15,0 L 20,8 L 15,15 L 0,15 Z" fill="#ff0080" opacity="0.3"/>
      <text x="10" y="12" font-family="Arial" font-size="8" fill="#ffffff" text-anchor="middle" font-weight="bold">G</text>
    </g>
  </svg>`;
}

/**
 * Grafiti 2: Logo con silueta de mono - estilo más grafitero y fumón
 */
function generateGraffitiMonkey(growName: string): string {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="spray2">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/>
      </filter>
      <filter id="glow2">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Efectos de spray paint de fondo (sin rectángulo) -->
    <ellipse cx="100" cy="80" rx="50" ry="35" fill="#ff6b00" opacity="0.2" filter="url(#spray2)"/>
    <ellipse cx="300" cy="320" rx="55" ry="40" fill="#00d4ff" opacity="0.2" filter="url(#spray2)"/>
    <ellipse cx="350" cy="150" rx="40" ry="30" fill="#ff0080" opacity="0.15" filter="url(#spray2)"/>
    <ellipse cx="50" cy="300" rx="35" ry="25" fill="#3bd420" opacity="0.15" filter="url(#spray2)"/>
    
    <!-- Silueta de mono MUCHO más grande para ocupar más espacio -->
    <g transform="translate(200, 200)" filter="url(#glow2)">
      <!-- Cabeza del mono mucho más grande -->
      <circle cx="0" cy="-50" r="60" fill="#3bd420" opacity="0.95" stroke="#2ba015" stroke-width="4"/>
      <!-- Orejas más grandes -->
      <circle cx="-45" cy="-70" r="18" fill="#2ba015"/>
      <circle cx="45" cy="-70" r="18" fill="#2ba015"/>
      <!-- Ojos más grandes -->
      <circle cx="-18" cy="-55" r="6" fill="#000000"/>
      <circle cx="18" cy="-55" r="6" fill="#000000"/>
      <!-- Sonrisa más grande -->
      <path d="M -22,-30 Q 0,-25 22,-30" stroke="#000000" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Cuerpo mucho más grande -->
      <ellipse cx="0" cy="40" rx="45" ry="60" fill="#3bd420" opacity="0.95" stroke="#2ba015" stroke-width="3"/>
      <!-- Brazos más grandes y marcados -->
      <ellipse cx="-50" cy="15" rx="18" ry="45" fill="#2ba015" transform="rotate(-25)"/>
      <ellipse cx="50" cy="15" rx="18" ry="45" fill="#2ba015" transform="rotate(25)"/>
      <!-- Cola más larga y curva -->
      <path d="M 30,65 Q 65,50 80,75 Q 70,90 55,85" stroke="#2ba015" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    
    <!-- Nombre con efecto de tag grafiti más fumón -->
    <g transform="translate(200, 350)">
      <!-- Sombra múltiple para efecto 3D -->
      <text x="5" y="5" 
            font-family="Impact, Arial Black, sans-serif" 
            font-size="48" 
            font-weight="900"
            fill="#000000" 
            text-anchor="middle"
            opacity="0.5"
            style="letter-spacing: 4px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
      <!-- Texto principal con outline grueso -->
      <text x="0" y="0" 
            font-family="Impact, Arial Black, sans-serif" 
            font-size="48" 
            font-weight="900"
            fill="#ffffff" 
            text-anchor="middle"
            stroke="#000000"
            stroke-width="2"
            style="letter-spacing: 4px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
      <!-- Highlight naranja grafiti -->
      <text x="-2" y="-2" 
            font-family="Impact, Arial Black, sans-serif" 
            font-size="48" 
            font-weight="900"
            fill="#ff6b00" 
            text-anchor="middle"
            opacity="0.9"
            style="letter-spacing: 4px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
    </g>
    
    <!-- Tags decorativos más grafiteros -->
    <g transform="translate(60, 60)">
      <path d="M 0,0 L 20,0 L 25,10 L 20,20 L 0,20 Z" fill="#ff6b00" opacity="0.4"/>
      <text x="12" y="15" font-family="Arial" font-size="10" fill="#ffffff" text-anchor="middle" font-weight="bold">420</text>
    </g>
    <g transform="translate(320, 320)">
      <path d="M 0,0 L 20,0 L 25,10 L 20,20 L 0,20 Z" fill="#00d4ff" opacity="0.4"/>
      <text x="12" y="15" font-family="Arial" font-size="10" fill="#ffffff" text-anchor="middle" font-weight="bold">G</text>
    </g>
    <!-- Líneas de tag grafiti -->
    <path d="M 30,350 Q 50,340 70,350" stroke="#3bd420" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
    <path d="M 330,50 Q 350,40 370,50" stroke="#ff0080" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
  </svg>`;
}

/**
 * Retro 1: Logo con planta de marihuana estilo años 70 - versión cuadrada sin fondo
 */
function generateRetroPlant(growName: string): string {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="retroGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Planta de marihuana estilo años 70 MUCHO más grande para ocupar más espacio -->
    <g transform="translate(200, 200)" filter="url(#retroGlow)">
      <!-- Tallo más grueso y largo -->
      <rect x="-6" y="0" width="12" height="90" fill="#8b7355"/>
      <!-- Hojas principales mucho más grandes -->
      <ellipse cx="-50" cy="20" rx="40" ry="26" fill="#3bd420" transform="rotate(-45)"/>
      <ellipse cx="50" cy="20" rx="40" ry="26" fill="#2ba015" transform="rotate(45)"/>
      <ellipse cx="0" cy="-30" rx="35" ry="32" fill="#4ce530"/>
      <!-- Hojas secundarias más grandes -->
      <ellipse cx="-32" cy="-12" rx="26" ry="18" fill="#2ba015" transform="rotate(-30)"/>
      <ellipse cx="32" cy="-12" rx="26" ry="18" fill="#3bd420" transform="rotate(30)"/>
      <!-- Detalles de las hojas más marcados -->
      <path d="M -50,20 Q -35,10 -25,20" stroke="#2ba015" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M 50,20 Q 35,10 25,20" stroke="#2ba015" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M 0,-30 Q -12,-40 -18,-30 Q -12,-20 0,-30" stroke="#2ba015" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Líneas de venas más marcadas -->
      <path d="M -32,-12 Q -22,-18 -14,-12" stroke="#2ba015" stroke-width="2.5" fill="none" opacity="0.7"/>
      <path d="M 32,-12 Q 22,-18 14,-12" stroke="#2ba015" stroke-width="2.5" fill="none" opacity="0.7"/>
    </g>
    
    <!-- Nombre con tipografía retro más grande -->
    <g transform="translate(200, 340)">
      <text x="0" y="0" 
            font-family="'Courier New', monospace" 
            font-size="36" 
            font-weight="bold"
            fill="#8b7355" 
            text-anchor="middle"
            stroke="#5d4e37"
            stroke-width="0.5"
            style="letter-spacing: 5px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
    </g>
    
    <!-- Líneas decorativas más largas -->
    <line x1="60" y1="280" x2="160" y2="280" stroke="#8b7355" stroke-width="3" stroke-linecap="round"/>
    <line x1="240" y1="280" x2="340" y2="280" stroke="#8b7355" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

/**
 * Retro 2: Logo con símbolo abstracto de growshop - versión cuadrada sin fondo
 */
function generateRetroSymbol(growName: string): string {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="retroGlow2">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Símbolo abstracto de growshop MUCHO más grande para ocupar más espacio -->
    <g transform="translate(200, 200)" filter="url(#retroGlow2)">
      <!-- Círculo exterior mucho más grande -->
      <circle cx="0" cy="0" r="75" fill="none" stroke="#8b7355" stroke-width="5"/>
      <!-- Círculo interior más grande -->
      <circle cx="0" cy="0" r="55" fill="#3bd420" opacity="0.25"/>
      <!-- Símbolo central: hoja estilizada mucho más grande -->
      <path d="M 0,-45 Q -18,-57 -27,-33 Q -33,-12 -18,0 Q -22,18 -12,27 Q 0,33 12,27 Q 22,18 18,0 Q 33,-12 27,-33 Q 18,-57 0,-45 Z" 
            fill="#3bd420" opacity="0.85" stroke="#2ba015" stroke-width="2.5"/>
      <!-- Líneas decorativas más largas -->
      <line x1="-33" y1="-33" x2="-52" y2="-52" stroke="#8b7355" stroke-width="4" stroke-linecap="round"/>
      <line x1="33" y1="-33" x2="52" y2="-52" stroke="#8b7355" stroke-width="4" stroke-linecap="round"/>
      <line x1="-33" y1="33" x2="-52" y2="52" stroke="#8b7355" stroke-width="4" stroke-linecap="round"/>
      <line x1="33" y1="33" x2="52" y2="52" stroke="#8b7355" stroke-width="4" stroke-linecap="round"/>
    </g>
    
    <!-- Nombre con efecto de letras vintage más grande -->
    <g transform="translate(200, 340)">
      <!-- Sombra del texto -->
      <text x="2" y="2" 
            font-family="Georgia, serif" 
            font-size="38" 
            font-weight="bold"
            fill="#8b7355" 
            text-anchor="middle"
            opacity="0.4"
            style="letter-spacing: 4px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
      <!-- Texto principal -->
      <text x="0" y="0" 
            font-family="Georgia, serif" 
            font-size="38" 
            font-weight="bold"
            fill="#5d4e37" 
            text-anchor="middle"
            stroke="#8b7355"
            stroke-width="0.5"
            style="letter-spacing: 4px;">
        ${escapeHtml(growName.toUpperCase())}
      </text>
    </g>
  </svg>`;
}

/**
 * Escapa caracteres HTML especiales para evitar problemas en SVG
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
