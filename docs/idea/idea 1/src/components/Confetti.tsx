import React, { useEffect, useRef, useCallback, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  shape: 'square' | 'circle' | 'strip';
}

const COLORS = [
  '#C8956C', // accent gold
  '#E8C9A0', // light gold
  '#A67C52', // dark gold
  '#D4A574', // warm tan
  '#F0D9B5', // cream
  '#8B6914', // deep gold
  '#FFD700', // bright gold
  '#FF8C42', // warm orange
];

function createParticle(canvasW: number, canvasH: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 3 + Math.random() * 8;
  const shapes: Particle['shape'][] = ['square', 'circle', 'strip'];

  return {
    x: canvasW / 2 + (Math.random() - 0.5) * 100,
    y: canvasH * 0.4,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 4,
    size: 4 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 15,
    life: 0,
    maxLife: 60 + Math.random() * 40,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  };
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | undefined>(undefined);

  const burst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsActive(true);
    const count = 60 + Math.floor(Math.random() * 30);
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(canvas.width, canvas.height),
    );
  }, []);

  // Listen for confetti events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'confetti') {
        burst();
      }
    };
    window.addEventListener('iterum-feedback', handler);
    return () => window.removeEventListener('iterum-feedback', handler);
  }, [burst]);

  // Animation loop
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      let alive = 0;

      for (const p of particles) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 4, -p.size, p.size / 2, p.size * 2);
        }

        ctx.restore();
      }

      if (alive > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsActive(false);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
