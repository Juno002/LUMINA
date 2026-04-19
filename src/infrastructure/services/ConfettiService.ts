/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

/**
 * Discrete, premium confetti system.
 * Uses a canvas overlay to render slow-falling light particles.
 */
class ConfettiService {
  private active = false;

  trigger(options: ConfettiOptions = {}) {
    if (this.active) return;
    this.active = true;

    const {
      particleCount = 25,
      spread = 70,
      origin = { x: 0.5, y: 0.3 },
      colors = ['#1a1a1a', '#999999', '#FAF8F5']
    } = options;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: particleCount }).map(() => ({
      x: width * origin.x,
      y: height * origin.y,
      vx: (Math.random() - 0.5) * (spread / 5),
      vy: Math.random() * -10 - 5,
      radius: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let stillActive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.vx *= 0.98; // Friction
        p.opacity -= 0.005;
        p.rotation += p.rotationSpeed;

        if (p.opacity > 0) {
          stillActive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
        }
      });

      if (stillActive) {
        requestAnimationFrame(render);
      } else {
        document.body.removeChild(canvas);
        this.active = false;
      }
    };

    render();
  }
}

export const confetti = new ConfettiService();
