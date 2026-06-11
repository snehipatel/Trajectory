import type { Chapter } from '@/types';

interface ConstellationViewProps {
  chapters: Chapter[];
  subjectColor: string;
  width?: number;
  height?: number;
}

/**
 * SVG constellation diagram for a subject's chapters.
 * Completed chapters = bright glowing star (✦)
 * Incomplete chapters = dim star (○)
 * Lines connect adjacent chapters in a constellation pattern.
 */
export default function ConstellationView({
  chapters,
  subjectColor,
  width = 500,
  height = 280,
}: ConstellationViewProps) {
  if (chapters.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)', fontSize: 14 }}>
        No chapters to display
      </div>
    );
  }

  // Position chapters in a constellation pattern
  const positions = generatePositions(chapters.length, width, height);

  // Determine completion per chapter
  const chapterStatus = chapters.map((ch) => {
    const totalItems = ch.lectures.length + ch.dpps.length;
    const completedItems =
      ch.lectures.filter((l) => l.completed).length +
      ch.dpps.filter((d) => d.completed).length;
    return {
      name: ch.name,
      completed: totalItems > 0 && completedItems === totalItems,
      partial: completedItems > 0 && completedItems < totalItems,
      pct: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  });

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="star-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Constellation lines */}
      {positions.map((pos, i) => {
        if (i === 0) return null;
        const prev = positions[i - 1];
        const bothCompleted = chapterStatus[i].completed && chapterStatus[i - 1].completed;
        return (
          <line
            key={`line-${i}`}
            x1={prev.x}
            y1={prev.y}
            x2={pos.x}
            y2={pos.y}
            stroke={bothCompleted ? subjectColor : 'rgba(148, 163, 184, 0.15)'}
            strokeWidth={bothCompleted ? 1.5 : 1}
            strokeDasharray={bothCompleted ? 'none' : '4 4'}
            opacity={bothCompleted ? 0.6 : 0.4}
          />
        );
      })}

      {/* Branch lines for larger constellations */}
      {chapters.length > 4 &&
        positions.map((pos, i) => {
          if (i < 2 || i % 3 !== 0) return null;
          const target = positions[Math.max(0, i - 2)];
          return (
            <line
              key={`branch-${i}`}
              x1={target.x}
              y1={target.y}
              x2={pos.x}
              y2={pos.y}
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          );
        })}

      {/* Stars (chapters) */}
      {positions.map((pos, i) => {
        const status = chapterStatus[i];
        const starSize = status.completed ? 5 : status.partial ? 4 : 3;
        const starColor = status.completed
          ? subjectColor
          : status.partial
          ? `${subjectColor}80`
          : 'rgba(148, 163, 184, 0.3)';

        return (
          <g key={`star-${i}`}>
            {/* Star glow for completed */}
            {status.completed && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={starSize + 4}
                fill="none"
                stroke={subjectColor}
                strokeWidth={1}
                opacity={0.2}
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.3;0.1"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Star body */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={starSize}
              fill={starColor}
              filter={status.completed ? 'url(#star-glow)' : undefined}
            />

            {/* Chapter label */}
            <text
              x={pos.x}
              y={pos.y + starSize + 14}
              textAnchor="middle"
              fill={status.completed ? 'var(--color-text-primary)' : 'var(--color-text-muted)'}
              fontSize={11}
              fontWeight={status.completed ? 600 : 400}
              fontFamily="Inter, sans-serif"
            >
              {truncateLabel(status.name, 20)}
            </text>

            {/* Completion indicator */}
            {status.partial && (
              <text
                x={pos.x}
                y={pos.y + starSize + 26}
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize={9}
                fontFamily="Inter, sans-serif"
              >
                {status.pct}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Helpers ──

function generatePositions(count: number, width: number, height: number) {
  const positions: { x: number; y: number }[] = [];
  const padX = 60;
  const padY = 40;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  if (count === 1) {
    return [{ x: width / 2, y: height / 2 }];
  }

  // Create a natural constellation pattern
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // Zigzag pattern with some variation
    const x = padX + t * usableW;
    const wave = Math.sin(t * Math.PI * 1.5) * usableH * 0.35;
    const y = height / 2 + wave + (i % 2 === 0 ? -15 : 15);
    positions.push({
      x: Math.max(padX, Math.min(width - padX, x)),
      y: Math.max(padY, Math.min(height - padY, y)),
    });
  }

  return positions;
}

function truncateLabel(label: string, maxLen: number): string {
  // Remove common prefixes
  let clean = label.replace(/^CH\s*\d+\s*:\s*/i, '');
  if (clean.length > maxLen) {
    return clean.slice(0, maxLen - 1) + '…';
  }
  return clean;
}
