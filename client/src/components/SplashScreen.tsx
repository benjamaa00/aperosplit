import { useState, useEffect, memo, useCallback, useRef } from "react";

const SPLASH_DURATION = 5200;

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    schedule(() => setDone(true), SPLASH_DURATION);
    schedule(onComplete, SPLASH_DURATION + 400);
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [];
    };
  }, [onComplete, schedule]);

  if (done) return null;

  return (
    <div className="apple-splash">
      <canvas ref={(canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.scale(dpr, dpr);

        const cx = W / 2;
        const cy = H / 2 - 40;
        let raf: number;
        const start = performance.now();

        interface Particle {
          x: number; y: number;
          vx: number; vy: number;
          life: number; maxLife: number;
          size: number; hue: number;
        }
        const particles: Particle[] = [];

        function spawnTrail(x: number, y: number, hue: number, count: number) {
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1.5 + 0.3;
            particles.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              maxLife: 30 + Math.random() * 40,
              size: Math.random() * 2.5 + 0.5,
              hue,
            });
          }
        }

        function easeInOutCubic(t: number) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function draw(now: number) {
          const t = (now - start) / 1000;
          ctx.clearRect(0, 0, W, H);

          // ── Phase 1: Orb 1 appears (0–0.3s) ──
          const orb1Alpha = Math.min(1, t / 0.3);
          const orb1Scale = t < 0.6
            ? easeInOutCubic(Math.min(1, t / 0.4))
            : 1 + 0.08 * Math.sin((t - 0.6) * 8) * Math.max(0, 1 - (t - 0.6) * 2);

          // ── Phase 2: Orb 2 appears (0.5–0.8s) ──
          const orb2Alpha = Math.min(1, Math.max(0, (t - 0.5) / 0.3));
          const orb2Scale = t > 0.5 && t < 1.0
            ? easeInOutCubic(Math.min(1, (t - 0.5) / 0.4))
            : t >= 1.0 ? 1 + 0.06 * Math.sin((t - 1.0) * 7) * Math.max(0, 1 - (t - 1.0) * 1.5) : 0;

          // ── Phase 3: Orbs converge (1.2–2.2s) ──
          const converge = t < 1.2 ? 0 : Math.min(1, easeInOutCubic((t - 1.2) / 1.0));
          const orbOffset = 70 * (1 - converge);

          const orb1X = cx - orbOffset;
          const orb1Y = cy;
          const orb2X = cx + orbOffset;
          const orb2Y = cy;

          const orbRadius = 28;

          // ── Draw particle trails ──
          if (t > 0.2 && t < 3.5) {
            spawnTrail(orb1X + (Math.random() - 0.5) * 10, orb1Y + (Math.random() - 0.5) * 10, 270, 1);
            spawnTrail(orb2X + (Math.random() - 0.5) * 10, orb2Y + (Math.random() - 0.5) * 10, 290, 1);
          }

          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 1 / p.maxLife;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.globalAlpha = p.life * 0.6;
            ctx.fillStyle = `hsl(${p.hue}, 70%, 70%)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
          }

          // ── Draw orbs with glow ──
          ctx.globalAlpha = 1;

          // Orb 1 glow
          if (orb1Alpha > 0) {
            const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orbRadius * 2.5);
            grad1.addColorStop(0, `rgba(139, 92, 246, ${0.5 * orb1Alpha})`);
            grad1.addColorStop(0.4, `rgba(123, 47, 247, ${0.25 * orb1Alpha})`);
            grad1.addColorStop(1, `rgba(123, 47, 247, 0)`);
            ctx.fillStyle = grad1;
            ctx.beginPath();
            ctx.arc(orb1X, orb1Y, orbRadius * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Orb 1 core
            const coreGrad1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orbRadius);
            coreGrad1.addColorStop(0, `rgba(196, 167, 255, ${orb1Alpha})`);
            coreGrad1.addColorStop(0.5, `rgba(139, 92, 246, ${orb1Alpha})`);
            coreGrad1.addColorStop(1, `rgba(123, 47, 247, ${0.8 * orb1Alpha})`);
            ctx.fillStyle = coreGrad1;
            ctx.beginPath();
            ctx.arc(orb1X, orb1Y, orbRadius * orb1Scale, 0, Math.PI * 2);
            ctx.fill();
          }

          // Orb 2 glow
          if (orb2Alpha > 0) {
            const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orbRadius * 2.5);
            grad2.addColorStop(0, `rgba(216, 180, 254, ${0.45 * orb2Alpha})`);
            grad2.addColorStop(0.4, `rgba(201, 166, 255, ${0.2 * orb2Alpha})`);
            grad2.addColorStop(1, `rgba(201, 166, 255, 0)`);
            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.arc(orb2X, orb2Y, orbRadius * 2.5, 0, Math.PI * 2);
            ctx.fill();

            const coreGrad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orbRadius);
            coreGrad2.addColorStop(0, `rgba(245, 235, 255, ${orb2Alpha})`);
            coreGrad2.addColorStop(0.5, `rgba(216, 180, 254, ${orb2Alpha})`);
            coreGrad2.addColorStop(1, `rgba(201, 166, 255, ${0.7 * orb2Alpha})`);
            ctx.fillStyle = coreGrad2;
            ctx.beginPath();
            ctx.arc(orb2X, orb2Y, orbRadius * orb2Scale, 0, Math.PI * 2);
            ctx.fill();
          }

          // ── Phase 4: Divider line (2.2–2.5s) ──
          if (t > 2.2) {
            const lineProgress = Math.min(1, (t - 2.2) / 0.3);
            const lineH = 80 * easeInOutCubic(lineProgress);
            const lineAlpha = Math.min(1, lineProgress * 1.5);

            ctx.globalAlpha = lineAlpha;
            const lineGrad = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
            lineGrad.addColorStop(0, "rgba(255,255,255,0)");
            lineGrad.addColorStop(0.3, "rgba(255,255,255,0.9)");
            lineGrad.addColorStop(0.5, "rgba(201,166,255,0.95)");
            lineGrad.addColorStop(0.7, "rgba(255,255,255,0.9)");
            lineGrad.addColorStop(1, "rgba(255,255,255,0)");
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - lineH / 2);
            ctx.lineTo(cx, cy + lineH / 2);
            ctx.stroke();

            // Line glow
            ctx.shadowColor = "rgba(201, 166, 255, 0.6)";
            ctx.shadowBlur = 12;
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy - lineH / 2);
            ctx.lineTo(cx, cy + lineH / 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // ── Phase 5: Ripple (2.5–3.2s) ──
          if (t > 2.5 && t < 3.8) {
            const rippleT = (t - 2.5) / 1.3;
            const rippleR = rippleT * Math.min(W, H) * 0.6;
            const rippleAlpha = Math.max(0, 1 - rippleT) * 0.5;
            ctx.globalAlpha = rippleAlpha;
            ctx.strokeStyle = "rgba(201, 166, 255, 0.7)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
            ctx.stroke();

            // Second ripple wave
            if (rippleT > 0.15) {
              const r2T = rippleT - 0.15;
              const r2R = r2T * Math.min(W, H) * 0.6;
              const r2A = Math.max(0, 1 - r2T) * 0.3;
              ctx.globalAlpha = r2A;
              ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(cx, cy, r2R, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // ── Phase 6: Orb merge flash (2.2s) ──
          if (t > 2.15 && t < 2.6) {
            const flashT = (t - 2.15) / 0.45;
            const flashAlpha = Math.max(0, 0.4 * (1 - flashT));
            ctx.globalAlpha = flashAlpha;
            const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
            flashGrad.addColorStop(0, "rgba(255,255,255,1)");
            flashGrad.addColorStop(0.5, "rgba(201,166,255,0.5)");
            flashGrad.addColorStop(1, "rgba(139,92,246,0)");
            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 80, 0, Math.PI * 2);
            ctx.fill();
          }

          // ── Ambient floating particles ──
          if (t > 0.5 && t < 4.5) {
            for (let i = 0; i < 3; i++) {
              const px = cx + Math.sin(t * 0.8 + i * 2.1) * (100 + i * 30);
              const py = cy + Math.cos(t * 0.6 + i * 1.7) * (60 + i * 20);
              const pAlpha = 0.15 + 0.1 * Math.sin(t * 2 + i);
              ctx.globalAlpha = pAlpha;
              ctx.fillStyle = i % 2 === 0 ? "rgba(139, 92, 246, 0.6)" : "rgba(201, 166, 255, 0.6)";
              ctx.beginPath();
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.globalAlpha = 1;
          raf = requestAnimationFrame(draw);
        }

        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
      }} className="apple-splash-canvas" />

      {/* Brand text overlay */}
      <div className="apple-splash-brand">
        <div className="apple-splash-logo-text">AperoSplit</div>
        <div className="apple-splash-tagline">Partagez, équilibrez</div>
      </div>

      {/* Exit fade */}
      <div className="apple-splash-fade" />
    </div>
  );
});

SplashScreen.displayName = "SplashScreen";
