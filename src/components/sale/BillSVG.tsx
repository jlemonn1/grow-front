interface BillSVGProps {
  value: number;
  className?: string;
}

const BILL_COLORS: Record<number, { primary: string; secondary: string; glow: string }> = {
  5: {
    primary: '#8B4513',
    secondary: '#A0522D',
    glow: 'rgba(139, 69, 19, 0.8)',
  },
  10: {
    primary: '#22C55E',
    secondary: '#16A34A',
    glow: 'rgba(34, 197, 94, 0.8)',
  },
  20: {
    primary: '#3B82F6',
    secondary: '#2563EB',
    glow: 'rgba(59, 130, 246, 0.8)',
  },
  50: {
    primary: '#A855F7',
    secondary: '#9333EA',
    glow: 'rgba(168, 85, 247, 0.8)',
  },
};

export function BillSVG({ value, className = '' }: BillSVGProps) {
  const colors = BILL_COLORS[value];
  const width = 90;
  const height = 55;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Filtro neon para el billete */}
        <filter id={`neon-glow-${value}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Filtro de brillo */}
        <filter id={`shimmer-${value}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur"/>
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Gradiente para el fondo del billete */}
        <linearGradient id={`bill-gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.2"/>
          <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.1"/>
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.2"/>
        </linearGradient>

        {/* Gradiente para el efecto shimmer */}
        <linearGradient id={`shimmer-gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0"/>
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0"/>
        </linearGradient>

        {/* Patrón decorativo para los bordes */}
        <pattern id={`pattern-${value}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1" fill={colors.primary} opacity="0.3"/>
        </pattern>
      </defs>

      {/* Fondo del billete con bordes redondeados */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx="4"
        ry="4"
        fill={`url(#bill-gradient-${value})`}
        stroke={colors.primary}
        strokeWidth="2.5"
        filter={`url(#neon-glow-${value})`}
        opacity="1"
      />

      {/* Borde decorativo superior estilo Monopoly */}
      <rect
        x="6"
        y="5"
        width={width - 12}
        height="2.5"
        rx="1"
        fill={colors.primary}
        opacity="1"
      />
      {/* Líneas decorativas superiores */}
      <line x1="8" y1="7.5" x2={width - 8} y2="7.5" stroke={colors.secondary} strokeWidth="1" opacity="0.9"/>

      {/* Borde decorativo inferior estilo Monopoly */}
      <rect
        x="6"
        y={height - 7.5}
        width={width - 12}
        height="2.5"
        rx="1"
        fill={colors.primary}
        opacity="1"
      />
      {/* Líneas decorativas inferiores */}
      <line x1="8" y1={height - 8.5} x2={width - 8} y2={height - 8.5} stroke={colors.secondary} strokeWidth="1" opacity="0.9"/>

      {/* Patrón decorativo en los bordes laterales estilo Monopoly */}
      <rect
        x="5"
        y="10"
        width="3"
        height={height - 20}
        rx="1"
        fill={colors.secondary}
        opacity="0.9"
      />
      <rect
        x={width - 8}
        y="10"
        width="3"
        height={height - 20}
        rx="1"
        fill={colors.secondary}
        opacity="0.9"
      />

      {/* Círculos decorativos en las esquinas estilo Monopoly */}
      <circle cx="10" cy="10" r="3" fill={colors.primary} opacity="0.8" stroke={colors.secondary} strokeWidth="1"/>
      <circle cx={width - 10} cy="10" r="3" fill={colors.primary} opacity="0.8" stroke={colors.secondary} strokeWidth="1"/>
      <circle cx="10" cy={height - 10} r="3" fill={colors.primary} opacity="0.8" stroke={colors.secondary} strokeWidth="1"/>
      <circle cx={width - 10} cy={height - 10} r="3" fill={colors.primary} opacity="0.8" stroke={colors.secondary} strokeWidth="1"/>

      {/* Números pequeños en las esquinas estilo Monopoly */}
      <text x="10" y="12.5" fontSize="9" fontWeight="900" fill={colors.secondary} textAnchor="middle" fontFamily="'Arial Black', 'Arial', sans-serif" opacity="1" stroke={colors.primary} strokeWidth="0.3">{value}</text>
      <text x={width - 10} y="12.5" fontSize="9" fontWeight="900" fill={colors.secondary} textAnchor="middle" fontFamily="'Arial Black', 'Arial', sans-serif" opacity="1" stroke={colors.primary} strokeWidth="0.3">{value}</text>
      <text x="10" y={height - 7.5} fontSize="9" fontWeight="900" fill={colors.secondary} textAnchor="middle" fontFamily="'Arial Black', 'Arial', sans-serif" opacity="1" stroke={colors.primary} strokeWidth="0.3">{value}</text>
      <text x={width - 10} y={height - 7.5} fontSize="9" fontWeight="900" fill={colors.secondary} textAnchor="middle" fontFamily="'Arial Black', 'Arial', sans-serif" opacity="1" stroke={colors.primary} strokeWidth="0.3">{value}</text>

      {/* Número principal grande estilo Monopoly */}
      <text
        x={width / 2}
        y={height / 2 + 10}
        fontSize="30"
        fontWeight="900"
        fill={colors.primary}
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial', sans-serif"
        filter={`url(#neon-glow-${value})`}
        style={{
          textShadow: `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}`,
          opacity: 1,
        }}
        letterSpacing="1.5px"
        opacity="1"
        stroke={colors.secondary}
        strokeWidth="0.5"
      >
        {value}
      </text>

      {/* Símbolo de euro integrado */}
      <text
        x={width / 2 + 22}
        y={height / 2 + 8}
        fontSize="20"
        fontWeight="900"
        fill={colors.secondary}
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial', sans-serif"
        opacity="1"
        filter={`url(#neon-glow-${value})`}
        stroke={colors.primary}
        strokeWidth="0.4"
      >
        €
      </text>

      {/* Líneas decorativas horizontales estilo Monopoly */}
      <line
        x1="14"
        y1={height / 2 - 6}
        x2={width - 14}
        y2={height / 2 - 6}
        stroke={colors.primary}
        strokeWidth="1.5"
        opacity="0.8"
        strokeDasharray="2,2"
      />
      <line
        x1="14"
        y1={height / 2 + 16}
        x2={width - 14}
        y2={height / 2 + 16}
        stroke={colors.primary}
        strokeWidth="1.5"
        opacity="0.8"
        strokeDasharray="2,2"
      />

      {/* Efecto de brillo animado */}
      <rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx="4"
        ry="4"
        fill={`url(#shimmer-gradient-${value})`}
        opacity="0.15"
        className="bill-shimmer"
      />
    </svg>
  );
}
