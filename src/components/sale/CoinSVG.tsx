interface CoinSVGProps {
  value: number;
  className?: string;
}

const COIN_COLORS: Record<number, { primary: string; secondary: string; glow: string; size: number }> = {
  0.10: {
    primary: '#F59E0B',
    secondary: '#D97706',
    glow: 'rgba(245, 158, 11, 0.8)',
    size: 40,
  },
  0.20: {
    primary: '#EF4444',
    secondary: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.8)',
    size: 42,
  },
  0.50: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    glow: 'rgba(139, 92, 246, 0.8)',
    size: 44,
  },
  1: {
    primary: '#10B981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.8)',
    size: 46,
  },
  2: {
    primary: '#06B6D4',
    secondary: '#0891B2',
    glow: 'rgba(6, 182, 212, 0.8)',
    size: 48,
  },
};

export function CoinSVG({ value, className = '' }: CoinSVGProps) {
  const colors = COIN_COLORS[value];
  const size = colors.size;
  const center = size / 2;
  const radius = size / 2 - 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Filtro neon para la moneda */}
        <filter id={`coin-neon-glow-${value}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Gradiente radial para el efecto 3D de la moneda */}
        <radialGradient id={`coin-gradient-${value}`} cx="50%" cy="30%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.35"/>
          <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.25"/>
        </radialGradient>

        {/* Gradiente para el borde de la moneda */}
        <linearGradient id={`coin-border-gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} stopOpacity="0.8"/>
          <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.8"/>
        </linearGradient>

        {/* Gradiente para el brillo superior */}
        <linearGradient id={`coin-shine-${value}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" stopOpacity="0.4"/>
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Círculo exterior de la moneda con borde */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={`url(#coin-gradient-${value})`}
        stroke={`url(#coin-border-gradient-${value})`}
        strokeWidth="2.5"
        filter={`url(#coin-neon-glow-${value})`}
        opacity="1"
      />

      {/* Borde decorativo interno */}
      <circle
        cx={center}
        cy={center}
        r={radius - 2}
        fill="none"
        stroke={colors.secondary}
        strokeWidth="1.2"
        opacity="0.85"
      />

      {/* Efecto de brillo superior */}
      <ellipse
        cx={center}
        cy={center - radius * 0.3}
        rx={radius * 0.7}
        ry={radius * 0.4}
        fill={`url(#coin-shine-${value})`}
        opacity="0.6"
      />

      {/* Número principal */}
      <text
        x={center}
        y={center + (value >= 1 ? 6 : 5)}
        fontSize={value >= 1 ? "18" : "15"}
        fontWeight="900"
        fill={colors.primary}
        textAnchor="middle"
        fontFamily="'Arial Black', 'Arial', sans-serif"
        filter={`url(#coin-neon-glow-${value})`}
        style={{
          textShadow: `0 0 10px ${colors.glow}, 0 0 20px ${colors.glow}`,
        }}
        opacity="1"
        letterSpacing="0.8px"
        stroke={colors.secondary}
        strokeWidth="0.4"
      >
        {value >= 1 ? `${value}€` : `${value * 100}c`}
      </text>

      {/* Líneas decorativas circulares internas */}
      <circle
        cx={center}
        cy={center}
        r={radius - 4}
        fill="none"
        stroke={colors.primary}
        strokeWidth="0.8"
        opacity="0.7"
        strokeDasharray="1,1"
      />

      {/* Puntos decorativos alrededor del borde */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 360) / 12;
        const rad = (angle * Math.PI) / 180;
        const x = center + (radius - 1) * Math.cos(rad);
        const y = center + (radius - 1) * Math.sin(rad);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1"
            fill={colors.secondary}
            opacity="0.85"
            stroke={colors.primary}
            strokeWidth="0.2"
          />
        );
      })}

      {/* Efecto de sombra inferior para profundidad */}
      <ellipse
        cx={center}
        cy={center + radius * 0.4}
        rx={radius * 0.8}
        ry={radius * 0.3}
        fill="rgba(0, 0, 0, 0.2)"
        opacity="0.3"
      />
    </svg>
  );
}
