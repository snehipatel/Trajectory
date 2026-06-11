import { useMemo } from 'react';

// ── Planet visual styles mapped by subject name ──
const PLANET_STYLES: Record<
  string,
  { gradient: string[]; ring?: boolean; glow: string; texture: 'crystal' | 'ring' | 'cyber' | 'lava' | 'energy' | 'gas' | 'rocky' | 'ice' }
> = {
  'Foundation of Engineering Mathematics': { gradient: ['#7C3AED', '#6366F1', '#4338CA'], glow: 'rgba(124, 58, 237, 0.3)', texture: 'crystal' },
  'Linear Algebra': { gradient: ['#8B5CF6', '#7C3AED', '#6D28D9'], ring: true, glow: 'rgba(139, 92, 246, 0.3)', texture: 'ring' },
  'Basics of Computer System': { gradient: ['#EC4899', '#DB2777', '#BE185D'], glow: 'rgba(236, 72, 153, 0.3)', texture: 'cyber' },
  'Database Management System': { gradient: ['#EF4444', '#DC2626', '#F97316'], glow: 'rgba(239, 68, 68, 0.3)', texture: 'lava' },
  'Algorithms': { gradient: ['#F59E0B', '#D97706', '#F97316'], glow: 'rgba(245, 158, 11, 0.3)', texture: 'energy' },
  'Calculus and Optimization': { gradient: ['#10B981', '#059669', '#047857'], glow: 'rgba(16, 185, 129, 0.3)', texture: 'gas' },
  'Python for Data Science': { gradient: ['#3B82F6', '#2563EB', '#1D4ED8'], glow: 'rgba(59, 130, 246, 0.3)', texture: 'gas' },
  'Verbal Aptitude': { gradient: ['#F59E0B', '#D97706', '#B45309'], glow: 'rgba(245, 158, 11, 0.25)', texture: 'rocky' },
  'Probability and Statistics': { gradient: ['#14B8A6', '#0D9488', '#0F766E'], glow: 'rgba(20, 184, 166, 0.3)', texture: 'ice' },
  'Machine Learning': { gradient: ['#A855F7', '#9333EA', '#7C3AED'], glow: 'rgba(168, 85, 247, 0.3)', texture: 'gas' },
  'Artificial Intelligence': { gradient: ['#22D3EE', '#06B6D4', '#0891B2'], glow: 'rgba(34, 211, 238, 0.3)', texture: 'cyber' },
  'Warehousing': { gradient: ['#84CC16', '#65A30D', '#4D7C0F'], glow: 'rgba(132, 204, 22, 0.25)', texture: 'rocky' },
  'General Aptitude': { gradient: ['#D946EF', '#C026D3', '#A21CAF'], glow: 'rgba(217, 70, 239, 0.3)', texture: 'rocky' },
  'Data Structure through Python': { gradient: ['#0EA5E9', '#0284C7', '#0369A1'], glow: 'rgba(14, 165, 233, 0.3)', texture: 'crystal' },
};

const DEFAULT_STYLE = { gradient: ['#6366F1', '#4F46E5', '#4338CA'], glow: 'rgba(99, 102, 241, 0.3)', texture: 'gas' as const };

interface PlanetRendererProps {
  subjectName: string;
  color: string;
  size?: number;
  completion: number; // 0-100
  animated?: boolean;
  showOrbit?: boolean;
  showLabel?: boolean;
}

export default function PlanetRenderer({
  subjectName,
  color,
  size = 80,
  completion,
  animated = true,
  showOrbit = true,
  showLabel = false,
}: PlanetRendererProps) {
  const style = PLANET_STYLES[subjectName] || DEFAULT_STYLE;
  const hasRing = style.ring || false;

  const gradientId = useMemo(() => `planet-grad-${subjectName.replace(/\s+/g, '-').toLowerCase()}`, [subjectName]);
  const orbitRadius = size * 0.72;
  const orbitStroke = Math.max(2, size * 0.03);
  const planetRadius = size * 0.35;
  const svgSize = size;
  const center = svgSize / 2;

  // Orbit progress arc
  const circumference = 2 * Math.PI * orbitRadius;
  const dashOffset = circumference * (1 - completion / 100);

  // Render planet texture shapes clipped inside the planet sphere
  const renderTexture = () => {
    switch (style.texture) {
      case 'crystal':
        return (
          <g opacity={0.15}>
            <polygon points={`${center},${center - planetRadius} ${center - planetRadius * 0.4},${center - planetRadius * 0.3} ${center},${center}`} fill="#ffffff" />
            <polygon points={`${center - planetRadius},${center} ${center - planetRadius * 0.4},${center - planetRadius * 0.3} ${center},${center}`} fill="#000000" />
            <polygon points={`${center - planetRadius},${center} ${center - planetRadius * 0.5},${center + planetRadius * 0.4} ${center},${center}`} fill="#ffffff" />
            <polygon points={`${center},${center + planetRadius} ${center - planetRadius * 0.5},${center + planetRadius * 0.4} ${center},${center}`} fill="#000000" />
            <polygon points={`${center},${center + planetRadius} ${center + planetRadius * 0.4},${center + planetRadius * 0.3} ${center},${center}`} fill="#ffffff" />
            <polygon points={`${center + planetRadius},${center} ${center + planetRadius * 0.4},${center + planetRadius * 0.3} ${center},${center}`} fill="#000000" />
            <polygon points={`${center + planetRadius},${center} ${center + planetRadius * 0.5},${center - planetRadius * 0.4} ${center},${center}`} fill="#ffffff" />
            <polygon points={`${center},${center - planetRadius} ${center + planetRadius * 0.5},${center - planetRadius * 0.4} ${center},${center}`} fill="#000000" />
          </g>
        );
      case 'cyber':
        return (
          <g opacity={0.35}>
            <line x1={center - planetRadius} y1={center - planetRadius * 0.5} x2={center + planetRadius} y2={center - planetRadius * 0.5} stroke="#ffffff" strokeWidth={0.5} strokeDasharray="2 3" />
            <line x1={center - planetRadius} y1={center + planetRadius * 0.5} x2={center + planetRadius} y2={center + planetRadius * 0.5} stroke="#ffffff" strokeWidth={0.5} strokeDasharray="2 3" />
            <line x1={center - planetRadius * 0.5} y1={center - planetRadius} x2={center - planetRadius * 0.5} y2={center + planetRadius} stroke="#ffffff" strokeWidth={0.5} strokeDasharray="2 3" />
            <line x1={center + planetRadius * 0.5} y1={center - planetRadius} x2={center + planetRadius * 0.5} y2={center + planetRadius} stroke="#ffffff" strokeWidth={0.5} strokeDasharray="2 3" />
            
            <circle cx={center} cy={center} r={planetRadius * 0.65} fill="none" stroke="#ffffff" strokeWidth={0.75} strokeDasharray="4 6" />
            <circle cx={center} cy={center} r={planetRadius * 0.35} fill="none" stroke="#ffffff" strokeWidth={0.5} opacity={0.4} />
            
            <circle cx={center - planetRadius * 0.3} cy={center - planetRadius * 0.3} r={1.5} fill="#ffffff" />
            <circle cx={center + planetRadius * 0.4} cy={center + planetRadius * 0.2} r={1.5} fill="#ffffff" />
          </g>
        );
      case 'lava':
        return (
          <g opacity={0.5}>
            <path d={`M ${center - planetRadius} ${center - planetRadius * 0.15} Q ${center - planetRadius * 0.4} ${center - planetRadius * 0.45} ${center} ${center - planetRadius * 0.05} T ${center + planetRadius} ${center - planetRadius * 0.25}`} fill="none" stroke="#FFA500" strokeWidth={2} style={{ filter: `drop-shadow(0 0 2px #FF4500)` }} />
            <path d={`M ${center - planetRadius * 0.8} ${center + planetRadius * 0.3} Q ${center} ${center + planetRadius * 0.1} ${center + planetRadius * 0.5} ${center + planetRadius * 0.5} T ${center + planetRadius} ${center + planetRadius * 0.15}`} fill="none" stroke="#FF4500" strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 1px #FF0000)` }} />
            <path d={`M ${center - planetRadius * 0.2} ${center - planetRadius * 0.8} Q ${center + planetRadius * 0.3} ${center - planetRadius * 0.2} ${center + planetRadius * 0.1} ${center + planetRadius * 0.2}`} fill="none" stroke="#FFA500" strokeWidth={1} />
          </g>
        );
      case 'energy':
        return (
          <g opacity={0.4}>
            <path d={`M ${center - planetRadius} ${center} C ${center - planetRadius * 0.5} ${center - planetRadius * 0.7} ${center + planetRadius * 0.5} ${center + planetRadius * 0.7} ${center + planetRadius} ${center}`} fill="none" stroke="#ffffff" strokeWidth={1.5} />
            <path d={`M ${center - planetRadius * 0.8} ${center + planetRadius * 0.4} C ${center - planetRadius * 0.2} ${center - planetRadius * 0.4} ${center + planetRadius * 0.2} ${center + planetRadius * 0.4} ${center + planetRadius * 0.8} ${center - planetRadius * 0.4}`} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.7} />
            <circle cx={center} cy={center} r={planetRadius * 0.8} fill="none" stroke="#ffffff" strokeWidth={0.5} strokeDasharray="10 15" />
          </g>
        );
      case 'gas':
        return (
          <g opacity={0.35}>
            <path d={`M ${center - planetRadius} ${center - planetRadius * 0.5} Q ${center} ${center - planetRadius * 0.4} ${center + planetRadius} ${center - planetRadius * 0.5} L ${center + planetRadius} ${center - planetRadius * 0.2} Q ${center} ${center - planetRadius * 0.1} ${center - planetRadius} ${center - planetRadius * 0.2} Z`} fill="#ffffff" />
            <path d={`M ${center - planetRadius} ${center - planetRadius * 0.05} Q ${center} ${center + planetRadius * 0.05} ${center + planetRadius} ${center - planetRadius * 0.05} L ${center + planetRadius} ${center + planetRadius * 0.2} Q ${center} ${center + planetRadius * 0.3} ${center - planetRadius} ${center + planetRadius * 0.2} Z`} fill="#000000" opacity={0.6} />
            <path d={`M ${center - planetRadius} ${center + planetRadius * 0.45} Q ${center} ${center + planetRadius * 0.55} ${center + planetRadius} ${center + planetRadius * 0.45} L ${center + planetRadius} ${center + planetRadius * 0.65} Q ${center} ${center + planetRadius * 0.75} ${center - planetRadius} ${center + planetRadius * 0.65} Z`} fill="#ffffff" />
          </g>
        );
      case 'rocky':
        return (
          <g opacity={0.3}>
            <g transform={`translate(${center - planetRadius * 0.45}, ${center - planetRadius * 0.3})`}>
              <circle cx={0} cy={0} r={planetRadius * 0.16} fill="#000000" opacity={0.7} />
              <circle cx={-0.5} cy={-0.5} r={planetRadius * 0.16} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />
            </g>
            <g transform={`translate(${center + planetRadius * 0.35}, ${center - planetRadius * 0.45})`}>
              <circle cx={0} cy={0} r={planetRadius * 0.11} fill="#000000" opacity={0.7} />
              <circle cx={-0.5} cy={-0.5} r={planetRadius * 0.11} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />
            </g>
            <g transform={`translate(${center + planetRadius * 0.4}, ${center + planetRadius * 0.3})`}>
              <circle cx={0} cy={0} r={planetRadius * 0.14} fill="#000000" opacity={0.7} />
              <circle cx={-0.5} cy={-0.5} r={planetRadius * 0.14} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />
            </g>
            <g transform={`translate(${center - planetRadius * 0.35}, ${center + planetRadius * 0.45})`}>
              <circle cx={0} cy={0} r={planetRadius * 0.09} fill="#000000" opacity={0.7} />
              <circle cx={-0.5} cy={-0.5} r={planetRadius * 0.09} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />
            </g>
          </g>
        );
      case 'ice':
        return (
          <g>
            <g opacity={0.25} stroke="#ffffff" strokeWidth={1} fill="none">
              <path d={`M ${center - planetRadius * 0.7} ${center - planetRadius * 0.5} L ${center - planetRadius * 0.3} ${center - planetRadius * 0.2} L ${center - planetRadius * 0.2} ${center - planetRadius * 0.6}`} />
              <path d={`M ${center + planetRadius * 0.2} ${center - planetRadius * 0.6} L ${center + planetRadius * 0.5} ${center - planetRadius * 0.3} L ${center + planetRadius * 0.7} ${center - planetRadius * 0.5}`} />
              <path d={`M ${center - planetRadius * 0.5} ${center + planetRadius * 0.3} L ${center} ${center + planetRadius * 0.1} L ${center + planetRadius * 0.4} ${center + planetRadius * 0.4}`} />
              <path d={`M ${center - planetRadius * 0.1} ${center - planetRadius * 0.2} L ${center + planetRadius * 0.2} ${center + planetRadius * 0.1} L ${center + planetRadius * 0.1} ${center + planetRadius * 0.4}`} />
            </g>
            <path d={`M ${center - planetRadius * 0.71} ${center - planetRadius * 0.71} A ${planetRadius} ${planetRadius} 0 0 1 ${center + planetRadius * 0.71} ${center - planetRadius * 0.71} Z`} fill="#ffffff" opacity={0.3} />
            <path d={`M ${center - planetRadius * 0.71} ${center + planetRadius * 0.71} A ${planetRadius} ${planetRadius} 0 0 0 ${center + planetRadius * 0.71} ${center + planetRadius * 0.71} Z`} fill="#ffffff" opacity={0.2} />
          </g>
        );
      default:
        return null;
    }
  };

  const renderRings = (isFront: boolean) => {
    if (!hasRing) return null;
    const ringStroke1 = Math.max(1, planetRadius * 0.05);
    const ringStroke2 = Math.max(1.5, planetRadius * 0.12);

    return (
      <g
        transform={`rotate(-15 ${center} ${center})`}
        clipPath={isFront ? `url(#${gradientId}-front-clip)` : undefined}
      >
        {/* Inner shadow/ring */}
        <ellipse
          cx={center}
          cy={center}
          rx={planetRadius * 1.3}
          ry={planetRadius * 0.3}
          fill="none"
          stroke={`${style.gradient[0]}25`}
          strokeWidth={ringStroke1}
        />
        {/* Main glowing ring */}
        <ellipse
          cx={center}
          cy={center}
          rx={planetRadius * 1.6}
          ry={planetRadius * 0.35}
          fill="none"
          stroke={`url(#${gradientId}-ring-grad)`}
          strokeWidth={ringStroke2}
          style={{
            filter: `drop-shadow(0 0 3px ${style.glow})`,
          }}
        />
        {/* Outer thin ring */}
        <ellipse
          cx={center}
          cy={center}
          rx={planetRadius * 1.85}
          ry={planetRadius * 0.4}
          fill="none"
          stroke={`${style.gradient[1]}35`}
          strokeWidth={ringStroke1}
        />
      </g>
    );
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: svgSize,
          height: svgSize,
          position: 'relative',
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Planet radial gradient */}
            <radialGradient id={gradientId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor={style.gradient[0]} />
              <stop offset="50%" stopColor={style.gradient[1]} />
              <stop offset="100%" stopColor={style.gradient[2]} />
            </radialGradient>
            
            {/* Shadow gradient for dark side / 3D sphere shape */}
            <radialGradient id={`${gradientId}-shadow`} cx="70%" cy="70%" r="60%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="40%" stopColor="rgba(0,0,0,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.85)" />
            </radialGradient>

            {/* Specular Highlight radial gradient */}
            <radialGradient id={`${gradientId}-specular`} cx="30%" cy="30%" r="35%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="40%" stopColor="rgba(255, 255, 255, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>

            {/* Ring gradient */}
            <linearGradient id={`${gradientId}-ring-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={style.gradient[0]} />
              <stop offset="50%" stopColor={style.gradient[1]} />
              <stop offset="100%" stopColor={`${style.gradient[2]}40`} />
            </linearGradient>

            {/* Mask to clip textures perfectly inside the planet sphere */}
            <mask id={`${gradientId}-mask`}>
              <circle cx={center} cy={center} r={planetRadius} fill="#ffffff" />
            </mask>

            {/* ClipPath for front of Saturn-like rings */}
            <clipPath id={`${gradientId}-front-clip`}>
              <rect
                x={center - size}
                y={center - size * 0.05}
                width={size * 2}
                height={size}
                transform={`rotate(-15 ${center} ${center})`}
              />
            </clipPath>
          </defs>

          {/* Orbit track */}
          {showOrbit && (
            <>
              <circle
                cx={center}
                cy={center}
                r={orbitRadius}
                fill="none"
                stroke="rgba(148, 163, 184, 0.08)"
                strokeWidth={orbitStroke}
              />
              {/* Orbit progress */}
              <circle
                cx={center}
                cy={center}
                r={orbitRadius}
                fill="none"
                stroke={color}
                strokeWidth={orbitStroke}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 4px ${style.glow})`,
                }}
              />
            </>
          )}

          {/* Back half of the ring (drawn behind planet) */}
          {renderRings(false)}

          {/* Planet body circle */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius}
            fill={`url(#${gradientId})`}
          />

          {/* Planet surface texture (masked to sphere) */}
          <g mask={`url(#${gradientId}-mask)`}>
            {renderTexture()}
          </g>

          {/* Dark side / terminator overlay (masked to sphere) */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius}
            fill={`url(#${gradientId}-shadow)`}
            pointerEvents="none"
          />

          {/* Specular highlight (glowing 3D reflect overlay) */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius}
            fill={`url(#${gradientId}-specular)`}
            pointerEvents="none"
          />

          {/* Atmosphere rim light glow */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth={1}
            pointerEvents="none"
          />

          {/* Front half of the ring (drawn in front of planet) */}
          {renderRings(true)}

          {/* Atmosphere glow circle */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius + 2}
            fill="none"
            stroke={style.gradient[0]}
            strokeWidth={1}
            opacity={0.3}
            style={animated ? {
              animation: 'pulse-subtle 4s ease-in-out infinite',
            } : undefined}
            pointerEvents="none"
          />
        </svg>

        {/* Completion text on orbit */}
        {showOrbit && (
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: Math.max(10, size * 0.13),
              fontWeight: 700,
              color: color,
              textShadow: `0 0 8px ${style.glow}`,
            }}
          >
            {completion}%
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div
          style={{
            fontSize: Math.max(11, size * 0.14),
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            maxWidth: size * 1.2,
            lineHeight: 1.3,
          }}
        >
          {subjectName}
        </div>
      )}
    </div>
  );
}
