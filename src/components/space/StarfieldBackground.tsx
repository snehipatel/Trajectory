import { useEffect, useRef } from 'react';

// ── Star types ──
interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number; // 0 = no twinkle
  twinklePhase: number;
  layer: number; // 0=far, 1=mid, 2=near
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

// ── Constants ──
const STAR_COUNT = 200;
const TWINKLE_FRACTION = 0.15; // Only 15% of stars twinkle
const SHOOTING_STAR_INTERVAL_MIN = 15000; // ms
const SHOOTING_STAR_INTERVAL_MAX = 30000;

function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const layer = i < STAR_COUNT * 0.5 ? 0 : i < STAR_COUNT * 0.8 ? 1 : 2;
    const twinkles = Math.random() < TWINKLE_FRACTION;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: layer === 0 ? 0.4 + Math.random() * 0.3 : layer === 1 ? 0.6 + Math.random() * 0.5 : 0.8 + Math.random() * 0.7,
      opacity: layer === 0 ? 0.2 + Math.random() * 0.2 : layer === 1 ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.4,
      twinkleSpeed: twinkles ? 0.0003 + Math.random() * 0.0008 : 0,
      twinklePhase: Math.random() * Math.PI * 2,
      layer,
    });
  }
  return stars;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animRef = useRef<number>(0);
  const nextShootingRef = useRef(Date.now() + SHOOTING_STAR_INTERVAL_MIN + Math.random() * (SHOOTING_STAR_INTERVAL_MAX - SHOOTING_STAR_INTERVAL_MIN));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      starsRef.current = createStars(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const draw = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (const star of starsRef.current) {
        let opacity = star.opacity;
        if (star.twinkleSpeed > 0) {
          star.twinklePhase += star.twinkleSpeed * dt;
          opacity = star.opacity * (0.4 + 0.6 * ((Math.sin(star.twinklePhase) + 1) / 2));
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 230, 255, ${opacity})`;
        ctx.fill();
      }

      // Shooting stars
      const now = Date.now();
      if (now > nextShootingRef.current) {
        const startX = Math.random() * canvas.width * 0.6;
        const startY = Math.random() * canvas.height * 0.4;
        shootingStarsRef.current.push({
          x: startX,
          y: startY,
          vx: 0.4 + Math.random() * 0.3,
          vy: 0.15 + Math.random() * 0.15,
          life: 0,
          maxLife: 600 + Math.random() * 400,
          length: 60 + Math.random() * 40,
        });
        nextShootingRef.current = now + SHOOTING_STAR_INTERVAL_MIN + Math.random() * (SHOOTING_STAR_INTERVAL_MAX - SHOOTING_STAR_INTERVAL_MIN);
      }

      // Draw & update shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
        ss.x += ss.vx * dt;
        ss.y += ss.vy * dt;
        ss.life += dt;
        const progress = ss.life / ss.maxLife;
        if (progress >= 1) return false;

        const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const tailX = ss.x - ss.vx * ss.length;
        const tailY = ss.y - ss.vy * ss.length;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(200, 210, 255, 0)`);
        grad.addColorStop(1, `rgba(200, 210, 255, ${alpha * 0.7})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        return true;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Subtle nebula gradient overlays */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 40% at 15% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 85% 20%, rgba(168, 85, 247, 0.03) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(34, 211, 238, 0.02) 0%, transparent 60%)
          `,
        }}
      />
    </>
  );
}
