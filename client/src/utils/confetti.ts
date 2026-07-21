interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number; rotationSpeed: number;
  opacity: number;
}

const COLORS = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export function launchConfetti(originX = 0.5, originY = 0.5, particleCount = 60) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { document.body.removeChild(canvas); return; }

  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;

  const particles: Particle[] = Array.from({ length: particleCount }, () => ({
    x: originX * w, y: originY * h,
    vx: (Math.random() - 0.5) * 12, vy: Math.random() * -14 - 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 6 + 3,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 15,
    opacity: 1,
  }));

  let frame: number;
  const animate = () => {
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.3;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.008;
      if (p.opacity <= 0) continue;
      alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive) {
      frame = requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  };
  frame = requestAnimationFrame(animate);
  setTimeout(() => { cancelAnimationFrame(frame); if (canvas.parentNode) document.body.removeChild(canvas); }, 3000);
}
