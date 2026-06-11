import { useRef, useEffect } from 'react';

// ── Helper: Blend two hex colors ──
const getBlendedColor = (color1: string, color2: string, ratio: number) => {
  const hex1 = color1.replace('#', '');
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const hex2 = color2.replace('#', '');
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * (1 - ratio));
  const g = Math.round(g1 + (g2 - g1) * (1 - ratio));
  const b = Math.round(b1 + (b2 - b1) * (1 - ratio));

  return `rgb(${r}, ${g}, ${b})`;
};

// ── Helper: Generate 2D Offscreen Texture Map ──
const generateTexture = (type: string, colors: string[], canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (type === 'gas') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors[2]);
    grad.addColorStop(0.5, colors[1]);
    grad.addColorStop(1, colors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Smooth horizontal cloud bands
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.15)';
      const bandY = (i * h) / 6;
      const bandH = h / 6;
      ctx.fillRect(0, bandY, w, bandH);

      // Fine details
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(0, bandY + bandH * 0.3, w, 2);
    }
  } else if (type === 'lava') {
    // Dark lava rock base
    ctx.fillStyle = '#0f0202';
    ctx.fillRect(0, 0, w, h);

    // Draw red/orange magma cracks
    ctx.strokeStyle = '#ff3c00';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // Glowing core magma spots
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const radGrad = ctx.createRadialGradient(x, y, 1, x, y, 12);
      radGrad.addColorStop(0, '#ff9900');
      radGrad.addColorStop(0.6, '#ff2200');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'rocky') {
    // Desert planet surface
    ctx.fillStyle = colors[2];
    ctx.fillRect(0, 0, w, h);

    // Dark patches
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Circular craters with shadows and rim highlights
    for (let i = 0; i < 16; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const r = 2 + Math.random() * 4;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === 'ice') {
    // Shimmering ice sheet gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f0f9ff');
    grad.addColorStop(0.5, colors[0]);
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Fractal ice cracks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.75;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // Polar glacier caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h * 0.15);
    ctx.fillRect(0, h * 0.85, w, h * 0.15);
  } else if (type === 'energy') {
    // Nebulous energy swirls
    ctx.fillStyle = colors[2];
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 6; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const radGrad = ctx.createRadialGradient(x, y, 2, x, y, 16);
      radGrad.addColorStop(0, '#ffffff');
      radGrad.addColorStop(0.5, colors[0]);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Default
    ctx.fillStyle = colors[1];
    ctx.fillRect(0, 0, w, h);
  }
};

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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const orbitRadius = size * 0.72;
  const orbitStroke = Math.max(2, size * 0.03);
  const planetRadius = size * 0.35;
  const svgSize = size;
  const center = svgSize / 2;

  // Orbit progress arc
  const circumference = 2 * Math.PI * orbitRadius;
  const dashOffset = circumference * (1 - completion / 100);

  // Initialize and run the 3D rendering pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use devicePixelRatio for rendering sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = svgSize * dpr;
    canvas.height = svgSize * dpr;
    ctx.scale(dpr, dpr);

    // Setup offscreen canvas for rendering sphere pixels cleanly
    const radius = planetRadius;
    const diameter = Math.floor(radius * 2);
    const sphereCanvas = document.createElement('canvas');
    sphereCanvas.width = diameter;
    sphereCanvas.height = diameter;
    const sphereCtx = sphereCanvas.getContext('2d')!;
    const sphereImageData = sphereCtx.createImageData(diameter, diameter);
    const data = sphereImageData.data;

    // Generate texture map offscreen
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 128;
    textureCanvas.height = 64;
    generateTexture(style.texture, style.gradient, textureCanvas);
    const textureCtx = textureCanvas.getContext('2d')!;
    const tw = textureCanvas.width;
    const th = textureCanvas.height;
    const textureData = textureCtx.getImageData(0, 0, tw, th);
    const texPixels = textureData.data;

    // Pre-calculate 3D sphere coordinate cache
    const cache: { x: number; y: number; dx: number; dy: number; dz: number }[] = [];
    for (let y = 0; y < diameter; y++) {
      const dy = (y - radius) / radius;
      for (let x = 0; x < diameter; x++) {
        const dx = (x - radius) / radius;
        const distSq = dx * dx + dy * dy;
        if (distSq <= 1) {
          const dz = Math.sqrt(1 - distSq);
          cache.push({ x, y, dx, dy, dz });
        }
      }
    }

    // 3D vector parameters
    const lx = -0.4;
    const ly = -0.4;
    const lz = 0.82;
    const lLength = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const nlx = lx / lLength;
    const nly = ly / lLength;
    const nlz = lz / lLength;

    const tiltAngle = -0.26; // ~15 degrees tilt
    const cosF = Math.cos(tiltAngle);
    const sinF = Math.sin(tiltAngle);

    // 3D Icosahedron for gem/crystal styles
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices: [number, number, number][] = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    const icosaVertices = rawVertices.map(v => {
      const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      return [v[0] / len, v[1] / len, v[2] / len] as [number, number, number];
    });
    const icosaFaces: [number, number, number][] = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    let animationId: number;
    let theta = 0;

    // Split ring clipping logic (front vs back of planet)
    const clipToHalf = (c: CanvasRenderingContext2D, isFront: boolean) => {
      c.beginPath();
      c.translate(center, center);
      c.rotate((-15 * Math.PI) / 180);
      if (isFront) {
        c.rect(-svgSize, -1, svgSize * 2, svgSize * 1.5);
      } else {
        c.rect(-svgSize, -svgSize * 1.5, svgSize * 2, svgSize * 1.5 + 1);
      }
      c.rotate((15 * Math.PI) / 180);
      c.translate(-center, -center);
      c.clip();
    };

    const drawRings = (c: CanvasRenderingContext2D) => {
      const ringStroke1 = Math.max(1, radius * 0.05);
      const ringStroke2 = Math.max(1.5, radius * 0.12);

      c.save();
      c.translate(center, center);
      c.rotate((-15 * Math.PI) / 180);

      // Outer thin ring
      c.strokeStyle = `${style.gradient[1]}30`;
      c.lineWidth = ringStroke1;
      c.beginPath();
      c.ellipse(0, 0, radius * 1.85, radius * 0.4, 0, 0, Math.PI * 2);
      c.stroke();

      // Main ring
      const ringGrad = c.createLinearGradient(-radius * 1.6, 0, radius * 1.6, 0);
      ringGrad.addColorStop(0, style.gradient[0]);
      ringGrad.addColorStop(0.5, style.gradient[1]);
      ringGrad.addColorStop(1, `${style.gradient[2]}40`);
      c.strokeStyle = ringGrad;
      c.lineWidth = ringStroke2;
      c.beginPath();
      c.ellipse(0, 0, radius * 1.6, radius * 0.35, 0, 0, Math.PI * 2);
      c.stroke();

      // Inner ring
      c.strokeStyle = `${style.gradient[0]}20`;
      c.lineWidth = ringStroke1;
      c.beginPath();
      c.ellipse(0, 0, radius * 1.3, radius * 0.3, 0, 0, Math.PI * 2);
      c.stroke();

      c.restore();
    };

    const renderFrame = () => {
      theta += animated ? 0.005 : 0;

      // Clear Canvas
      ctx.clearRect(0, 0, svgSize, svgSize);

      // 1. Draw back half of the rings
      if (hasRing) {
        ctx.save();
        clipToHalf(ctx, false);
        drawRings(ctx);
        ctx.restore();
      }

      // 2. Draw 3D planet body
      if (style.texture === 'crystal') {
        // Flat-shaded 3D Gem facet renderer
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const rotatedVertices = icosaVertices.map(v => {
          const x1 = v[0] * cosT + v[2] * sinT;
          const y1 = v[1];
          const z1 = -v[0] * sinT + v[2] * cosT;

          const rx = x1 * cosF - y1 * sinF;
          const ry = x1 * sinF + y1 * cosF;
          const rz = z1;
          return [rx, ry, rz] as [number, number, number];
        });

        // Painers depth sorting
        const faceDepths = icosaFaces.map((face, index) => {
          const zSum = rotatedVertices[face[0]][2] + rotatedVertices[face[1]][2] + rotatedVertices[face[2]][2];
          return { index, depth: zSum / 3 };
        });
        faceDepths.sort((a, b) => a.depth - b.depth);

        for (const fd of faceDepths) {
          const face = icosaFaces[fd.index];
          const v0 = rotatedVertices[face[0]];
          const v1 = rotatedVertices[face[1]];
          const v2 = rotatedVertices[face[2]];

          // Backface culling
          const ux = v1[0] - v0[0];
          const uy = v1[1] - v0[1];
          const uz = v1[2] - v0[2];
          const vx = v2[0] - v0[0];
          const vy = v2[1] - v0[1];
          const vz = v2[2] - v0[2];
          const nz = ux * vy - uy * vx;
          if (nz <= 0) continue;

          // Normalize normal
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const nnx = nx / nLen;
          const nny = ny / nLen;
          const nnz = nz / nLen;

          const dot = nnx * nlx + nny * nly + nnz * nlz;
          const intensity = Math.max(0.1, dot);

          ctx.beginPath();
          ctx.moveTo(center + v0[0] * radius, center + v0[1] * radius);
          ctx.lineTo(center + v1[0] * radius, center + v1[1] * radius);
          ctx.lineTo(center + v2[0] * radius, center + v2[1] * radius);
          ctx.closePath();

          ctx.fillStyle = getBlendedColor(style.gradient[0], style.gradient[2], intensity);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      } else if (style.texture === 'cyber') {
        // Holographic 3D projected wireframe grid
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Draw latitude rings
        ctx.lineWidth = 0.75;
        for (let lat = -0.8; lat <= 0.8; lat += 0.2) {
          const latRadius = Math.sqrt(1 - lat * lat);
          ctx.beginPath();
          let first = true;
          for (let deg = 0; deg <= 360; deg += 10) {
            const rad = (deg * Math.PI) / 180;
            const px = latRadius * Math.cos(rad);
            const py = lat;
            const pz = latRadius * Math.sin(rad);

            const rx = px * cosT + pz * sinT;
            const ry = py;
            const rz = -px * sinT + pz * cosT;

            const tx = rx * cosF - ry * sinF;
            const ty = rx * sinF + ry * cosF;
            const tz = rz;

            ctx.strokeStyle = tz > 0 ? `${color}bb` : `${color}20`;
            const cx = center + tx * radius;
            const cy = center + ty * radius;

            if (first) {
              ctx.moveTo(cx, cy);
              first = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          }
          ctx.stroke();
        }

        // Draw longitude rings
        for (let lon = 0; lon < 180; lon += 30) {
          const lonRad = (lon * Math.PI) / 180;
          ctx.beginPath();
          let first = true;
          for (let deg = 0; deg <= 360; deg += 10) {
            const rad = (deg * Math.PI) / 180;
            const px = Math.cos(rad) * Math.cos(lonRad);
            const py = Math.sin(rad);
            const pz = Math.cos(rad) * Math.sin(lonRad);

            const rx = px * cosT + pz * sinT;
            const ry = py;
            const rz = -px * sinT + pz * cosT;

            const tx = rx * cosF - ry * sinF;
            const ty = rx * sinF + ry * cosF;
            const tz = rz;

            ctx.strokeStyle = tz > 0 ? `${color}99` : `${color}15`;
            const cx = center + tx * radius;
            const cy = center + ty * radius;

            if (first) {
              ctx.moveTo(cx, cy);
              first = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          }
          ctx.stroke();
        }
      } else {
        // Pixel shader / texture projected rotating 3D sphere
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        for (let i = 0; i < cache.length; i++) {
          const p = cache[i];

          // Rotate around Y
          const rx = p.dx * cosT + p.dz * sinT;
          const ry = p.dy;
          const rz = -p.dx * sinT + p.dz * cosT;

          // Rotate around Z (tilt)
          const tx = rx * cosF - ry * sinF;
          const ty = rx * sinF + ry * cosF;
          const tz = rz;

          // Map to 2D texture coordinates
          const v = Math.asin(ty) / Math.PI + 0.5;
          const u = Math.atan2(tx, tz) / (Math.PI * 2) + 0.5;

          const tx_pixel = Math.floor(u * tw) % tw;
          const ty_pixel = Math.floor(v * th) % th;
          const texIdx = (ty_pixel * tw + tx_pixel) * 4;

          // Lighting calculations (surface normal is [tx, ty, tz])
          const dot = tx * nlx + ty * nly + tz * nlz;
          const diffuse = Math.max(0, dot);

          // Specular highlights
          const rz_refl = 2 * diffuse * tz - nlz;
          const specular = Math.pow(Math.max(0, rz_refl), 12) * 0.35;

          const ambient = 0.12;
          const lightFactor = ambient + 0.88 * diffuse;

          const pixelIdx = (p.y * diameter + p.x) * 4;
          data[pixelIdx] = Math.min(255, texPixels[texIdx] * lightFactor + specular * 255);
          data[pixelIdx + 1] = Math.min(255, texPixels[texIdx + 1] * lightFactor + specular * 255);
          data[pixelIdx + 2] = Math.min(255, texPixels[texIdx + 2] * lightFactor + specular * 255);
          data[pixelIdx + 3] = 255;
        }
        sphereCtx.putImageData(sphereImageData, 0, 0);

        // Blit back onto the main canvas with hardware blend/anti-aliasing
        ctx.drawImage(sphereCanvas, center - radius, center - radius);
      }

      // 3. Draw front half of the rings
      if (hasRing) {
        ctx.save();
        clipToHalf(ctx, true);
        drawRings(ctx);
        ctx.restore();
      }

      if (animated) {
        animationId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [style, animated, planetRadius, svgSize, center, color]);

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
        {/* Canvas overlay for true 3D rotating model */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: svgSize,
            height: svgSize,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ overflow: 'visible', position: 'relative', zIndex: 2, pointerEvents: 'none' }}
        >
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

          {/* Atmosphere outer glow overlay (pulsing) */}
          <circle
            cx={center}
            cy={center}
            r={planetRadius + 2}
            fill="none"
            stroke={style.gradient[0]}
            strokeWidth={1}
            opacity={0.25}
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
              zIndex: 3,
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

