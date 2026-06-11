import { useMemo } from 'react';

// ── Planet visual styles mapped by subject name ──
const PLANET_STYLES: Record<string, { gradient: string[]; ring?: boolean; glow: string }> = {
  'Foundation of Engineering Mathematics': { gradient: ['#7C3AED', '#6366F1', '#4338CA'], glow: 'rgba(124, 58, 237, 0.3)' },
  'Linear Algebra': { gradient: ['#8B5CF6', '#7C3AED', '#6D28D9'], ring: true, glow: 'rgba(139, 92, 246, 0.3)' },
  'Basics of Computer System': { gradient: ['#EC4899', '#DB2777', '#BE185D'], glow: 'rgba(236, 72, 153, 0.3)' },
  'Database Management System': { gradient: ['#EF4444', '#DC2626', '#F97316'], glow: 'rgba(239, 68, 68, 0.3)' },
  'Algorithms': { gradient: ['#F59E0B', '#D97706', '#F97316'], glow: 'rgba(245, 158, 11, 0.3)' },
  'Calculus and Optimization': { gradient: ['#10B981', '#059669', '#047857'], glow: 'rgba(16, 185, 129, 0.3)' },
  'Python for Data Science': { gradient: ['#3B82F6', '#2563EB', '#1D4ED8'], glow: 'rgba(59, 130, 246, 0.3)' },
  'Verbal Aptitude': { gradient: ['#F59E0B', '#D97706', '#B45309'], glow: 'rgba(245, 158, 11, 0.25)' },
  'Probability and Statistics': { gradient: ['#14B8A6', '#0D9488', '#0F766E'], glow: 'rgba(20, 184, 166, 0.3)' },
  'Machine Learning': { gradient: ['#A855F7', '#9333EA', '#7C3AED'], glow: 'rgba(168, 85, 247, 0.3)' },
  'Artificial Intelligence': { gradient: ['#22D3EE', '#06B6D4', '#0891B2'], glow: 'rgba(34, 211, 238, 0.3)' },
  'Warehousing': { gradient: ['#84CC16', '#65A30D', '#4D7C0F'], glow: 'rgba(132, 204, 22, 0.25)' },
  'General Aptitude': { gradient: ['#D946EF', '#C026D3', '#A21CAF'], glow: 'rgba(217, 70, 239, 0.3)' },
  'Data Structure through Python': { gradient: ['#0EA5E9', '#0284C7', '#0369A1'], glow: 'rgba(14, 165, 233, 0.3)' },
};

const DEFAULT_STYLE = { gradient: ['#6366F1', '#4F46E5', '#4338CA'], glow: 'rgba(99, 102, 241, 0.3)' };

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
  const hasRing = (style as any).ring || false;

  const gradientId = useMemo(() => `planet-grad-${subjectName.replace(/\s+/g, '-').toLowerCase()}`, [subjectName]);
  const orbitRadius = size * 0.72;
  const orbitStroke = Math.max(2, size * 0.03);
  const planetRadius = size * 0.35;
  const svgSize = size;
  const center = svgSize / 2;

  // Orbit progress arc
  const circumference = 2 * Math.PI * orbitRadius;
  const dashOffset = circumference * (1 - completion / 100);

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
            {/* Shadow gradient for dark side */}
            <radialGradient id={`${gradientId}-shadow`} cx="70%" cy="70%" r="60%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
            </radialGradient>
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

          {/* Saturn-like ring */}
          {hasRing && (
            <ellipse
              cx={center}
              cy={center}
              rx={planetRadius * 1.6}
              ry={planetRadius * 0.35}
              fill="none"
              stroke={`${style.gradient[0]}60`}
              strokeWidth={Math.max(1.5, planetRadius * 0.08)}
              transform={`rotate(-15 ${center} ${center})`}
            />
          )}

          {/* Planet body */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius}
            fill={`url(#${gradientId})`}
          />
          {/* Dark side overlay */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius}
            fill={`url(#${gradientId}-shadow)`}
          />

          {/* Atmosphere glow */}
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
